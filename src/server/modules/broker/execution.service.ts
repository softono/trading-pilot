import { decrypt } from "@/server/lib/auth";
import { infoLog, errorLog } from "@/server/lib/logger";
import { listVerifiedEnabledConnections } from "@/server/models/broker-connection.repository";
import {
  reserveExecution,
  updateExecution,
  countOpenPositions,
  countStoppedToday,
  listOpenExecutionsForSignal,
} from "@/server/models/order-execution.repository";
import { findInstrument } from "@/server/models/broker-instrument.repository";
import { getAdapter } from "@/server/modules/broker/adapters/registry";
import {
  BROKER,
  BROKER_INSTRUMENT_CLASSES,
  EXECUTION_STATUS,
} from "@/modules/broker/broker.constants";
import type { ISignal, IBrokerConnection } from "@/server/models/schema";

function getCredentials(connection: IBrokerConnection): Record<string, string> {
  return connection.credentials
    ? (JSON.parse(decrypt(connection.credentials)) as Record<string, string>)
    : {};
}

async function resolveTradeInstrument(
  connection: IBrokerConnection,
  signal: ISignal,
): Promise<{ brokerSymbol: string; exchange: string; lotSize: number } | null> {
  if (connection.broker === BROKER.PAPER) {
    return {
      brokerSymbol: signal.symbol,
      exchange: signal.exchange ?? signal.market,
      lotSize: 1,
    };
  }
  const instrument = await findInstrument(
    connection.broker,
    signal.exchange ?? signal.market,
    signal.symbol,
  );
  if (!instrument) return null;
  return {
    brokerSymbol: instrument.broker_symbol ?? signal.symbol,
    exchange: instrument.exchange,
    lotSize: Number(instrument.lot_size) || 1,
  };
}

function computeQty(
  connection: IBrokerConnection,
  entry: number,
  stop: number,
  lotSize: number,
): number {
  const riskPerShare = Math.abs(entry - stop);
  if (riskPerShare <= 0) return 0;

  let qty = Math.floor(Number(connection.risk_per_trade) / riskPerShare);
  if (lotSize > 1) qty = Math.floor(qty / lotSize) * lotSize;
  if (connection.max_qty) qty = Math.min(qty, connection.max_qty);
  if (connection.max_position_value) {
    const maxQtyByValue = Math.floor(
      Number(connection.max_position_value) / entry,
    );
    qty = Math.min(qty, maxQtyByValue);
  }
  return Math.max(qty, 0);
}

async function executeForConnection(
  connection: IBrokerConnection,
  signal: ISignal,
): Promise<void> {
  const reservation = await reserveExecution({
    connection_id: connection.id,
    signal_id: signal.id,
    status: EXECUTION_STATUS.PENDING,
  });
  // undefined = another attempt already reserved this (connection, signal) pair — the unique
  // index is the dedupe guarantee, not an application-level check.
  if (!reservation) return;

  const skip = async (reason: string) => {
    await updateExecution(reservation.id, {
      status: EXECUTION_STATUS.SKIPPED,
      reason,
    });
  };

  try {
    const supportedClasses = BROKER_INSTRUMENT_CLASSES[connection.broker] ?? [];
    if (!supportedClasses.includes(signal.instrument_class)) {
      await skip(
        `${connection.broker} does not trade ${signal.instrument_class} instruments`,
      );
      return;
    }

    if (signal.published_at) {
      const ageMinutes = (Date.now() - signal.published_at.getTime()) / 60000;
      if (ageMinutes > connection.max_signal_age_minutes) {
        await skip(
          `signal is ${Math.round(ageMinutes)}min old, older than max_signal_age_minutes=${connection.max_signal_age_minutes}`,
        );
        return;
      }
    }

    if (connection.max_open_positions) {
      const open = await countOpenPositions(connection.id);
      if (open >= connection.max_open_positions) {
        await skip(
          `max_open_positions (${connection.max_open_positions}) reached`,
        );
        return;
      }
    }

    if (connection.daily_loss_cap) {
      // Phase 1 proxy: each stop-out is assumed to cost one full risk_per_trade unit — real
      // realized-PnL tracking is Phase 2 (see signals' reserved exit_price/return_pct columns).
      const stoppedToday = await countStoppedToday(connection.id);
      const assumedLossToday = stoppedToday * Number(connection.risk_per_trade);
      if (assumedLossToday >= Number(connection.daily_loss_cap)) {
        await skip(`daily_loss_cap (${connection.daily_loss_cap}) reached`);
        return;
      }
    }

    const instrument = await resolveTradeInstrument(connection, signal);
    if (!instrument) {
      await skip(
        `no broker_instruments row for ${connection.broker}/${signal.exchange ?? signal.market}/${signal.symbol} — run the instrument sync`,
      );
      return;
    }

    const entry = Number(signal.entry);
    const stop = Number(signal.stop_loss);
    const qty = computeQty(connection, entry, stop, instrument.lotSize);
    if (qty <= 0) {
      await skip("computed quantity is zero given risk_per_trade/lot size");
      return;
    }

    const credentials = getCredentials(connection);
    const adapter = getAdapter(connection.broker);

    const orderResult = await adapter.placeOrder(credentials, connection.mode, {
      brokerSymbol: instrument.brokerSymbol,
      exchange: instrument.exchange,
      side: signal.side as "long" | "short",
      qty,
      referencePrice: entry,
    });

    if (orderResult.status === "rejected") {
      await updateExecution(reservation.id, {
        status: EXECUTION_STATUS.REJECTED,
        reason: "broker rejected the entry order",
        qty,
        raw: orderResult.raw as object,
        attempts: 1,
      });
      return;
    }

    // The stop-loss is placed as a REAL resting order — the single guard against an uncapped
    // loss while this process is offline (round-3 Q4 decision). An entry that fills but whose
    // stop fails to place is the worst case here; it's logged loudly rather than silently.
    let stopOrderId: string | null = null;
    try {
      const stopResult = await adapter.placeStop(credentials, connection.mode, {
        brokerSymbol: instrument.brokerSymbol,
        exchange: instrument.exchange,
        side: signal.side as "long" | "short",
        qty,
        referencePrice: entry,
        stopPrice: stop,
      });
      stopOrderId = stopResult.brokerOrderId || null;
    } catch (err: unknown) {
      errorLog(
        "execution: entry placed but stop-loss order FAILED — position is unprotected",
        {
          connectionId: connection.id,
          signalId: signal.id,
          brokerOrderId: orderResult.brokerOrderId,
          error: err instanceof Error ? err.message : String(err),
        },
      );
    }

    await updateExecution(reservation.id, {
      status:
        orderResult.status === "filled"
          ? EXECUTION_STATUS.FILLED
          : EXECUTION_STATUS.PLACED,
      qty,
      entry_price: String(entry),
      broker_order_id: orderResult.brokerOrderId || null,
      stop_order_id: stopOrderId,
      raw: orderResult.raw as object,
      attempts: 1,
    });

    infoLog("execution placed", {
      connectionId: connection.id,
      signalId: signal.id,
      broker: connection.broker,
      qty,
    });
  } catch (err: unknown) {
    await updateExecution(reservation.id, {
      status: EXECUTION_STATUS.FAILED,
      reason: err instanceof Error ? err.message : String(err),
      attempts: 1,
    });
  }
}

/** Called once per PUBLISHED signal — fans out to every verified, enabled connection whose
 * broker trades this signal's instrument class. */
export async function processSignalForExecution(
  signal: ISignal,
): Promise<void> {
  const connections = await listVerifiedEnabledConnections();
  await Promise.all(
    connections.map((connection) => executeForConnection(connection, signal)),
  );
}

const TERMINAL_EXIT_STATUSES = [
  "TARGET_REACHED",
  "STOPPED",
  "FAILED",
  "EXPIRED",
];

/** Called on every lifecycle transition to a terminal status. STOPPED on a real broker is
 * already closed by the resting stop order placed at entry — nothing to do but record it.
 * Everything else (target reached / failed / expired, or STOPPED in paper mode, which never had
 * a real resting stop) closes the position with an opposite-side market order. */
export async function processSignalExit(signal: ISignal): Promise<void> {
  if (!TERMINAL_EXIT_STATUSES.includes(signal.status)) return;

  const executions = await listOpenExecutionsForSignal(signal.id);
  for (const execution of executions) {
    try {
      const connections = await listVerifiedEnabledConnections();
      const connection = connections.find(
        (c) => c.id === execution.connection_id,
      );
      if (!connection) continue;

      const credentials = getCredentials(connection);
      const adapter = getAdapter(connection.broker);

      if (signal.status === "STOPPED" && connection.broker !== BROKER.PAPER) {
        await updateExecution(execution.id, {
          status: EXECUTION_STATUS.FILLED,
          reason: "closed by broker stop order",
        });
        continue;
      }

      if (execution.stop_order_id) {
        await adapter
          .cancelOrder(credentials, connection.mode, execution.stop_order_id)
          .catch(() => {});
      }

      const instrument = await resolveTradeInstrument(connection, signal);
      const closeResult = await adapter.placeOrder(
        credentials,
        connection.mode,
        {
          brokerSymbol: instrument?.brokerSymbol ?? signal.symbol,
          exchange: instrument?.exchange ?? signal.exchange ?? signal.market,
          side: signal.side === "long" ? "short" : "long",
          qty: execution.qty ?? 0,
          referencePrice: Number(signal.exit_price ?? signal.entry),
        },
      );

      await updateExecution(execution.id, {
        status: EXECUTION_STATUS.FILLED,
        reason: `closed: ${signal.status}`,
        raw: closeResult.raw as object,
      });
    } catch (err: unknown) {
      errorLog("execution exit failed", {
        executionId: execution.id,
        signalId: signal.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
