import { getAdapter } from "@/server/modules/broker/adapters/registry";
import { upsertInstrument } from "@/server/models/broker-instrument.repository";
import { infoLog, errorLog } from "@/server/lib/logger";
import {
  BROKER,
  BROKER_SUPPORTED_MODES,
} from "@/modules/broker/broker.constants";

/** Daily instrument-master sync — one broker/mode at a time, called by the scheduled job. Paper
 * needs no sync (it never resolves through broker_instruments — see paper.adapter.ts). */
export async function syncInstrumentsForBroker(
  broker: string,
  mode: string,
): Promise<{ synced: number }> {
  const adapter = getAdapter(broker);
  const instruments = await adapter.fetchInstruments(mode);
  const now = new Date();

  for (const instrument of instruments) {
    await upsertInstrument({
      broker,
      exchange: instrument.exchange,
      symbol: instrument.symbol,
      broker_symbol: instrument.brokerSymbol,
      broker_token: instrument.brokerToken,
      lot_size: String(instrument.lotSize),
      tick_size: String(instrument.tickSize),
      instrument_class: instrument.instrumentClass,
      is_active: true,
      synced_at: now,
    });
  }

  infoLog("instrument sync complete", {
    broker,
    mode,
    synced: instruments.length,
  });
  return { synced: instruments.length };
}

export async function syncAllInstruments(): Promise<void> {
  for (const broker of Object.values(BROKER)) {
    if (broker === BROKER.PAPER) continue;
    const modes = BROKER_SUPPORTED_MODES[broker] ?? [];
    // One sync per broker (using its primary/live mode) — instrument masters (symbol/lot/tick)
    // are venue-wide facts, not different between live and sandbox for the same broker.
    const mode = modes.includes("live") ? "live" : modes[0];
    if (!mode) continue;
    try {
      await syncInstrumentsForBroker(broker, mode);
    } catch (err: unknown) {
      errorLog(
        `instrument sync failed for ${broker}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
