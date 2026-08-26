import { randomUUID } from "crypto";
import type {
  BrokerAdapter,
  VerifyResult,
  SyncedInstrument,
  PlaceOrderInput,
  PlaceStopInput,
  PlaceOrderResult,
} from "@/server/modules/broker/adapters/types";

// Internal simulator — no real venue, no credentials, always available. Fills are assumed
// instant at the signal's own entry/stop price; real exits are tracked by the lifecycle webhook
// (signal.updated -> TARGET_REACHED/STOPPED), not by this adapter watching the market itself.
export const paperAdapter: BrokerAdapter = {
  broker: "paper",

  async verify(): Promise<VerifyResult> {
    return { ok: true };
  },

  async fetchInstruments(): Promise<SyncedInstrument[]> {
    // Paper mode never resolves through broker_instruments — execution.service.ts uses the
    // signal's own symbol/exchange directly for this broker.
    return [];
  },

  async placeOrder(
    _credentials: Record<string, string>,
    _mode: string,
    input: PlaceOrderInput,
  ): Promise<PlaceOrderResult> {
    return {
      brokerOrderId: `PAPER-${randomUUID()}`,
      status: "filled",
      raw: { simulated: true, ...input },
    };
  },

  async placeStop(
    _credentials: Record<string, string>,
    _mode: string,
    input: PlaceStopInput,
  ): Promise<PlaceOrderResult> {
    return {
      brokerOrderId: `PAPER-${randomUUID()}`,
      status: "placed",
      raw: { simulated: true, ...input },
    };
  },

  async cancelOrder(): Promise<void> {
    // Nothing resting to cancel — simulated stops don't hit a real venue.
  },
};

export default paperAdapter;
