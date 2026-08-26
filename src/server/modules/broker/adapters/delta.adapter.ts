// Delta Exchange adapter (https://docs.delta.exchange/). Dormant in Phase 1 — no crypto-signal
// analyst exists yet (see broker.constants.ts's BROKER_INSTRUMENT_CLASSES), wired for when one
// does. VERIFY BEFORE LIVE USE: the standalone (non-bracket) stop-order field combination below
// is the researcher's best reading of the docs, not a confirmed working request — test against
// the testnet before any real order.
import { createHmac } from "crypto";
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
    ? "https://testnet-api.delta.exchange"
    : "https://api.delta.exchange";
}

function getCreds(credentials: Record<string, string>): {
  apiKey: string;
  apiSecret: string;
} {
  const apiKey = credentials.apiKey;
  const apiSecret = credentials.apiSecret;
  if (!apiKey || !apiSecret) {
    throw new Error("Delta Exchange credentials missing apiKey/apiSecret");
  }
  return { apiKey, apiSecret };
}

async function signedFetch(
  mode: string,
  credentials: Record<string, string>,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const { apiKey, apiSecret } = getCreds(credentials);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = body ? JSON.stringify(body) : "";
  const signaturePayload = `${method}${timestamp}${path}${bodyStr}`;
  const signature = createHmac("sha256", apiSecret)
    .update(signaturePayload)
    .digest("hex");

  return fetch(`${baseUrl(mode)}${path}`, {
    method,
    headers: {
      "api-key": apiKey,
      signature,
      timestamp,
      "User-Agent": "trading-pilot-adapter",
      "Content-Type": "application/json",
    },
    body: bodyStr || undefined,
  });
}

export const deltaAdapter: BrokerAdapter = {
  broker: "delta",

  async verify(credentials, mode): Promise<VerifyResult> {
    try {
      const res = await signedFetch(
        mode,
        credentials,
        "GET",
        "/v2/orders?states=open",
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

  async fetchInstruments(mode): Promise<SyncedInstrument[]> {
    const res = await fetch(`${baseUrl(mode)}/v2/products`);
    if (!res.ok)
      throw new Error(`Delta products fetch failed: HTTP ${res.status}`);
    const json = (await res.json()) as {
      result?: Array<{
        symbol: string;
        state: string;
        tick_size?: string;
        contract_value?: string;
      }>;
    };

    return (json.result ?? [])
      .filter((p) => p.state === "live")
      .map((p) => ({
        exchange: "DELTA",
        symbol: p.symbol,
        brokerSymbol: p.symbol,
        lotSize: Number(p.contract_value) || 1,
        tickSize: Number(p.tick_size) || 0.5,
        instrumentClass: "crypto" as const,
      }));
  },

  async placeOrder(
    credentials,
    mode,
    input: PlaceOrderInput,
  ): Promise<PlaceOrderResult> {
    const res = await signedFetch(mode, credentials, "POST", "/v2/orders", {
      product_symbol: input.brokerSymbol,
      side: input.side === "long" ? "buy" : "sell",
      size: input.qty,
      order_type: "market_order",
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return {
      brokerOrderId: String(json.result?.id ?? ""),
      status: json.result?.state === "closed" ? "filled" : "placed",
      raw: json,
    };
  },

  async placeStop(
    credentials,
    mode,
    input: PlaceStopInput,
  ): Promise<PlaceOrderResult> {
    const res = await signedFetch(mode, credentials, "POST", "/v2/orders", {
      product_symbol: input.brokerSymbol,
      side: input.side === "long" ? "sell" : "buy",
      size: input.qty,
      order_type: "market_order",
      stop_order_type: "stop_loss_order",
      stop_price: String(input.stopPrice),
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return {
      brokerOrderId: String(json.result?.id ?? ""),
      status: "placed",
      raw: json,
    };
  },

  async cancelOrder(credentials, mode, brokerOrderId): Promise<void> {
    await signedFetch(mode, credentials, "DELETE", "/v2/orders", {
      id: Number(brokerOrderId),
    });
  },
};

export default deltaAdapter;
