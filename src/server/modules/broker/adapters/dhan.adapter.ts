// Dhan (DhanHQ v2) adapter (https://dhanhq.co/docs/v2/). VERIFY BEFORE LIVE USE: field names
// below are drawn from public docs as of this build; the instrument CSV's exact security-id
// column name could not be confirmed from docs alone (see fetchInstruments' defensive header
// search) — inspect a real downloaded file before trusting the parsed output for live orders.
import type {
  BrokerAdapter,
  VerifyResult,
  SyncedInstrument,
  PlaceOrderInput,
  PlaceStopInput,
  PlaceOrderResult,
} from "@/server/modules/broker/adapters/types";

function baseUrl(mode: string): string {
  return mode === "sandbox"
    ? "https://sandbox.dhan.co/v2"
    : "https://api.dhan.co/v2";
}

function headers(accessToken: string): Record<string, string> {
  return {
    "access-token": accessToken,
    "Content-Type": "application/json",
  };
}

function getCreds(credentials: Record<string, string>): {
  clientId: string;
  accessToken: string;
} {
  const clientId = credentials.clientId;
  const accessToken = credentials.accessToken;
  if (!clientId || !accessToken) {
    throw new Error("Dhan credentials missing clientId/accessToken");
  }
  return { clientId, accessToken };
}

export const dhanAdapter: BrokerAdapter = {
  broker: "dhan",

  async verify(credentials, mode): Promise<VerifyResult> {
    try {
      const { accessToken } = getCreds(credentials);
      const res = await fetch(`${baseUrl(mode)}/orders`, {
        headers: headers(accessToken),
      });
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}: ${await res.text()}` };
      }
      return { ok: true };
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  async fetchInstruments(): Promise<SyncedInstrument[]> {
    const res = await fetch(
      "https://images.dhan.co/api-data/api-scrip-master.csv",
    );
    if (!res.ok)
      throw new Error(`Dhan instrument CSV fetch failed: HTTP ${res.status}`);
    const text = await res.text();

    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim());
    const findCol = (needle: string) =>
      header.findIndex((h) => h.toUpperCase().includes(needle));

    const iExch = findCol("SEM_EXM_EXCH_ID");
    const iSymbol = findCol("SEM_CUSTOM_SYMBOL");
    const iSeries = findCol("SEM_SERIES");
    const iLot = findCol("SEM_LOT_UNITS");
    const iTick = findCol("SEM_TICK_SIZE");
    // Not confirmed from docs — defensive search for whatever the security-id column is
    // actually called in the live file.
    const iSecId = findCol("SECURITY_ID");
    if (iSymbol === -1 || iExch === -1) return [];

    const out: SyncedInstrument[] = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      if (iSeries !== -1 && cols[iSeries] && cols[iSeries].trim() !== "EQ")
        continue;
      const symbol = cols[iSymbol]?.trim();
      const exchange = cols[iExch]?.trim();
      if (!symbol || !exchange) continue;
      out.push({
        exchange,
        symbol,
        brokerSymbol: symbol,
        brokerToken: iSecId !== -1 ? cols[iSecId]?.trim() : undefined,
        lotSize: iLot !== -1 ? Number(cols[iLot]) || 1 : 1,
        tickSize: iTick !== -1 ? Number(cols[iTick]) || 0.05 : 0.05,
        instrumentClass: "equity",
      });
    }
    return out;
  },

  async placeOrder(
    credentials,
    mode,
    input: PlaceOrderInput,
  ): Promise<PlaceOrderResult> {
    const { clientId, accessToken } = getCreds(credentials);
    const res = await fetch(`${baseUrl(mode)}/orders`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({
        dhanClientId: clientId,
        transactionType: input.side === "long" ? "BUY" : "SELL",
        exchangeSegment: "NSE_EQ",
        productType: "CNC",
        orderType: "MARKET",
        validity: "DAY",
        securityId: input.brokerSymbol,
        quantity: input.qty,
        price: 0,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return {
      brokerOrderId: json.orderId,
      status: json.orderStatus === "TRADED" ? "filled" : "placed",
      raw: json,
    };
  },

  async placeStop(
    credentials,
    mode,
    input: PlaceStopInput,
  ): Promise<PlaceOrderResult> {
    const { clientId, accessToken } = getCreds(credentials);
    const res = await fetch(`${baseUrl(mode)}/orders`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({
        dhanClientId: clientId,
        transactionType: input.side === "long" ? "SELL" : "BUY",
        exchangeSegment: "NSE_EQ",
        productType: "CNC",
        orderType: "STOP_LOSS_MARKET",
        validity: "DAY",
        securityId: input.brokerSymbol,
        quantity: input.qty,
        price: 0,
        triggerPrice: input.stopPrice,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return { brokerOrderId: json.orderId, status: "placed", raw: json };
  },

  async cancelOrder(credentials, mode, brokerOrderId): Promise<void> {
    const { accessToken } = getCreds(credentials);
    await fetch(`${baseUrl(mode)}/orders/${brokerOrderId}`, {
      method: "DELETE",
      headers: headers(accessToken),
    });
  },
};

export default dhanAdapter;
