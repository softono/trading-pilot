export interface VerifyResult {
  ok: boolean;
  error?: string;
}

export interface PlaceOrderInput {
  brokerSymbol: string;
  exchange: string;
  side: "long" | "short";
  qty: number;
  referencePrice: number;
}

export interface PlaceStopInput extends PlaceOrderInput {
  stopPrice: number;
}

export interface PlaceOrderResult {
  brokerOrderId: string;
  status: "placed" | "filled" | "rejected";
  raw: unknown;
}

export interface SyncedInstrument {
  exchange: string;
  symbol: string;
  brokerSymbol: string;
  brokerToken?: string;
  lotSize: number;
  tickSize: number;
  instrumentClass: "equity" | "crypto";
}

/**
 * One adapter per broker (+ Paper). The execution engine (execution.service.ts) never talks to a
 * broker's HTTP API directly — everything goes through this interface, so live/sandbox/paper all
 * run the exact same signal-processing pipeline up to this boundary.
 */
export interface BrokerAdapter {
  broker: string;

  verify(
    credentials: Record<string, string>,
    mode: string,
  ): Promise<VerifyResult>;

  /** Pulls the broker's own instrument/product master and returns it — the caller
   * (instrument-sync.service.ts) upserts into `broker_instruments`. Adapter does no DB I/O. */
  fetchInstruments(mode: string): Promise<SyncedInstrument[]>;

  placeOrder(
    credentials: Record<string, string>,
    mode: string,
    input: PlaceOrderInput,
  ): Promise<PlaceOrderResult>;

  placeStop(
    credentials: Record<string, string>,
    mode: string,
    input: PlaceStopInput,
  ): Promise<PlaceOrderResult>;

  cancelOrder(
    credentials: Record<string, string>,
    mode: string,
    brokerOrderId: string,
  ): Promise<void>;
}
