// Angel One (SmartAPI) adapter. Live-only NSE equity broker.
//
// The auth flow, header set, and TOTP-login mechanics below are ported from this codebase's
// sibling trading project's already-working market-data provider
// (../../../../../trading/admin_backend/src/modules/market-data/angel-one.provider.ts), which
// documents its endpoint paths as taken verbatim from Angel's own official JS connector
// (github.com/angel-one/smartapi-javascript). That provider only reads market data — this
// adapter adds the order-placement endpoints (placeOrder/cancelOrder), which are NOT present in
// the source file and are drawn from SmartAPI's public docs (smartapi.angelbroking.com/docs/Orders)
// instead. VERIFY BEFORE LIVE USE: the auth/header/login/instrument-parsing logic is reused
// production code and high-confidence; the order-placement field names are not from a
// verified-working source the way the rest of this file is — confirm against a live sandbox call
// before real money.
//
// Per-connection credentials (unlike the sibling provider, which reads one shared account from
// global settings): { apiKey, clientCode, password, totpSecret }.
//
// NOT ported: the sibling provider's SOCKS-proxy support for Angel's static-IP requirement
// (fetch-socks — a new dependency, and deployment-specific). If this server's own outbound IP
// isn't already whitelisted with Angel, add that separately; every call here goes out directly.
import { generate as generateTotp } from "otplib";
import type {
  BrokerAdapter,
  VerifyResult,
  SyncedInstrument,
  PlaceOrderInput,
  PlaceStopInput,
  PlaceOrderResult,
} from "@/server/modules/broker/adapters/types";

const BASE_URL = "https://apiconnect.angelone.in";
const SCRIP_MASTER_URL =
  "https://margin.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json";

const LOGIN_PATH = "/rest/auth/angelbroking/user/v1/loginByPassword";
const PLACE_ORDER_PATH = "/rest/secure/angelbroking/order/v1/placeOrder";
const CANCEL_ORDER_PATH = "/rest/secure/angelbroking/order/v1/cancelOrder";

interface AngelCredentials {
  apiKey: string;
  clientCode: string;
  password: string;
  totpSecret: string;
}

function getCreds(credentials: Record<string, string>): AngelCredentials {
  const { apiKey, clientCode, password, totpSecret } = credentials;
  if (!apiKey || !clientCode || !password || !totpSecret) {
    throw new Error(
      "Angel One credentials missing apiKey/clientCode/password/totpSecret",
    );
  }
  return { apiKey, clientCode, password, totpSecret };
}

function baseHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-PrivateKey": apiKey,
    // Best-effort placeholders — Angel's docs ask for these literally but treat them as
    // format-level, not a live reachability check (see the sibling provider's own note).
    "X-ClientLocalIP": "127.0.0.1",
    "X-ClientPublicIP": "127.0.0.1",
    "X-MACAddress": "02:00:00:00:00:00",
  };
}

interface AngelEnvelope<T> {
  status?: boolean;
  message?: string;
  errorcode?: string;
  data?: T;
}

async function login(creds: AngelCredentials): Promise<string> {
  const totp = await generateTotp({ secret: creds.totpSecret });
  const res = await fetch(`${BASE_URL}${LOGIN_PATH}`, {
    method: "POST",
    headers: baseHeaders(creds.apiKey),
    body: JSON.stringify({
      clientcode: creds.clientCode,
      password: creds.password,
      totp,
    }),
  });
  if (!res.ok) throw new Error(`Angel One login failed: HTTP ${res.status}`);

  const json = (await res.json()) as AngelEnvelope<{ jwtToken?: string }>;
  const jwt = json.data?.jwtToken;
  if (!json.status || !jwt) {
    throw new Error(
      `Angel One login did not return a token${json.errorcode ? ` (errorcode ${json.errorcode})` : ""}`,
    );
  }
  return jwt;
}

async function authedFetch(
  credentials: Record<string, string>,
  path: string,
  body: unknown,
): Promise<{ res: Response; json: AngelEnvelope<Record<string, unknown>> }> {
  const creds = getCreds(credentials);
  const jwt = await login(creds);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { ...baseHeaders(creds.apiKey), Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as AngelEnvelope<Record<string, unknown>>;
  return { res, json };
}

interface ScripMasterRow {
  token: string;
  symbol: string;
  name: string;
  lotsize?: string;
  instrumenttype?: string;
  exch_seg: string;
  tick_size?: string;
}

export const angelOneAdapter: BrokerAdapter = {
  broker: "angelone",

  async verify(credentials): Promise<VerifyResult> {
    try {
      await login(getCreds(credentials));
      return { ok: true };
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  async fetchInstruments(): Promise<SyncedInstrument[]> {
    const res = await fetch(SCRIP_MASTER_URL);
    if (!res.ok)
      throw new Error(
        `Angel One scrip master fetch failed: HTTP ${res.status}`,
      );
    const rows = (await res.json()) as ScripMasterRow[];
    if (!Array.isArray(rows)) return [];

    const out: SyncedInstrument[] = [];
    for (const row of rows) {
      const exchange = (row.exch_seg || "").toUpperCase();
      if (exchange !== "NSE" && exchange !== "BSE") continue;
      if (row.instrumenttype) continue; // non-empty => derivative, not cash equity
      if (!row.symbol?.endsWith("-EQ") || !row.token) continue;

      out.push({
        exchange,
        symbol: row.symbol.slice(0, -"-EQ".length),
        brokerSymbol: row.symbol,
        brokerToken: row.token,
        lotSize: row.lotsize ? Number(row.lotsize) || 1 : 1,
        tickSize: row.tick_size ? Number(row.tick_size) / 100 : 0.05,
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
    const { res, json } = await authedFetch(credentials, PLACE_ORDER_PATH, {
      variety: "NORMAL",
      tradingsymbol: input.brokerSymbol,
      exchange: input.exchange,
      transactiontype: input.side === "long" ? "BUY" : "SELL",
      ordertype: "MARKET",
      producttype: "DELIVERY",
      duration: "DAY",
      price: "0",
      quantity: String(input.qty),
    });
    if (!res.ok || !json.status) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return {
      brokerOrderId: String(json.data?.orderid ?? ""),
      status: "placed",
      raw: json,
    };
  },

  async placeStop(
    credentials,
    _mode,
    input: PlaceStopInput,
  ): Promise<PlaceOrderResult> {
    const { res, json } = await authedFetch(credentials, PLACE_ORDER_PATH, {
      variety: "STOPLOSS",
      tradingsymbol: input.brokerSymbol,
      exchange: input.exchange,
      transactiontype: input.side === "long" ? "SELL" : "BUY",
      ordertype: "STOPLOSS_MARKET",
      producttype: "DELIVERY",
      duration: "DAY",
      triggerprice: String(input.stopPrice),
      price: "0",
      quantity: String(input.qty),
    });
    if (!res.ok || !json.status) {
      return { brokerOrderId: "", status: "rejected", raw: json };
    }
    return {
      brokerOrderId: String(json.data?.orderid ?? ""),
      status: "placed",
      raw: json,
    };
  },

  async cancelOrder(credentials, _mode, brokerOrderId): Promise<void> {
    await authedFetch(credentials, CANCEL_ORDER_PATH, {
      variety: "NORMAL",
      orderid: brokerOrderId,
    });
  },
};

export default angelOneAdapter;
