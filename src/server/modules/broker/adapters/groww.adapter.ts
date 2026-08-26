// Groww Trading API adapter (https://groww.in/trade-api/docs). Live-only — Groww publishes no
// sandbox. VERIFY BEFORE LIVE USE: field names below are drawn from the public docs as of this
// build; Groww's TOTP/approval token-exchange flows require a manual daily approval step and are
// not fully non-interactive, so this adapter takes the simplest CORRECT credential: a manually
// generated daily access token (Groww dashboard -> Trading APIs -> Access Token). The user must
// refresh this token once a day; there is no automated refresh path Groww exposes without a
// human click. Re-verify exact request/response JSON against live docs before relying on this
// with real money — the researcher who gathered these facts flagged this same caveat.
import type {
  BrokerAdapter,
  VerifyResult,
  SyncedInstrument,
  PlaceOrderInput,
  PlaceStopInput,
  PlaceOrderResult,
} from "@/server/modules/broker/adapters/types";

const BASE_URL = "https://api.groww.in/v1";

function headers(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-VERSION": "1.0",
  };
}

function getAccessToken(credentials: Record<string, string>): string {
  const token = credentials.accessToken;
  if (!token) throw new Error("Groww credentials missing accessToken");
  return token;
}

export const growwAdapter: BrokerAdapter = {
  broker: "groww",

  async verify(credentials): Promise<VerifyResult> {
    try {
      const accessToken = getAccessToken(credentials);
      const res = await fetch(
        `${BASE_URL}/order/list?segment=CASH&page=0&page_size=1`,
        { headers: headers(accessToken) },
      );
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
    // Groww publishes a CSV instrument master, no JSON endpoint.
    const res = await fetch(
      "https://growwapi-assets.groww.in/instruments/instrument.csv",
    );
    if (!res.ok)
      throw new Error(`Groww instrument CSV fetch failed: HTTP ${res.status}`);
    const text = await res.text();

    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim());
    const col = (name: string) => header.indexOf(name);

    const iSymbol = col("trading_symbol");
    const iExchange = col("exchange");
    const iLot = col("lot_size");
    const iTick = col("tick_size");
    const iToken = col("exchange_token");
    const iType = col("instrument_type");
    if (iSymbol === -1 || iExchange === -1) return [];

    const out: SyncedInstrument[] = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      // Only plain equity rows for Phase 1 — options/futures rows carry an expiry/strike and
      // are out of scope for this platform.
      if (iType !== -1 && cols[iType] && cols[iType] !== "EQ") continue;
      const symbol = cols[iSymbol]?.trim();
      const exchange = cols[iExchange]?.trim();
      if (!symbol || !exchange) continue;
      out.push({
        exchange,
        symbol: symbol.replace(/-EQ$/, ""),
        brokerSymbol: symbol,
        brokerToken: iToken !== -1 ? cols[iToken]?.trim() : undefined,
        lotSize: iLot !== -1 ? Number(cols[iLot]) || 1 : 1,
        tickSize: iTick !== -1 ? Number(cols[iTick]) || 0.05 : 0.05,
        instrumentClass: "equity",
      });
    }
    return out;
  },

  async placeOrder(
    credentials,
    _mode,
    input: PlaceOrderInput,
  ): Promise<PlaceOrderResult> {
    const accessToken = getAccessToken(credentials);
    const res = await fetch(`${BASE_URL}/order/create`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({
        trading_symbol: input.brokerSymbol,
        exchange: input.exchange,
        segment: "CASH",
        transaction_type: input.side === "long" ? "BUY" : "SELL",
        order_type: "MARKET",
        quantity: input.qty,
        price: 0,
        product: "CNC",
        validity: "DAY",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return {
      brokerOrderId: json.groww_order_id,
      status: json.order_status === "EXECUTED" ? "filled" : "placed",
      raw: json,
    };
  },

  async placeStop(
    credentials,
    _mode,
    input: PlaceStopInput,
  ): Promise<PlaceOrderResult> {
    const accessToken = getAccessToken(credentials);
    // Stop is the opposite transaction of the entry — exits a long via SELL, a short via BUY.
    const res = await fetch(`${BASE_URL}/order/create`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({
        trading_symbol: input.brokerSymbol,
        exchange: input.exchange,
        segment: "CASH",
        transaction_type: input.side === "long" ? "SELL" : "BUY",
        order_type: "SL",
        trigger_price: input.stopPrice,
        quantity: input.qty,
        price: input.stopPrice,
        product: "CNC",
        validity: "DAY",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return {
      brokerOrderId: json.groww_order_id,
      status: "placed",
      raw: json,
    };
  },

  async cancelOrder(credentials, _mode, brokerOrderId): Promise<void> {
    const accessToken = getAccessToken(credentials);
    await fetch(`${BASE_URL}/order/cancel`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({ segment: "CASH", groww_order_id: brokerOrderId }),
    });
  },
};

export default growwAdapter;
