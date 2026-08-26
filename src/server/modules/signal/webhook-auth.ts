import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { decrypt } from "@/server/lib/auth";
import {
  getActiveApiKeyByKeyId,
  touchLastUsed,
} from "@/server/models/analyst-api-key.repository";
import type { IAnalystApiKey } from "@/server/models/schema";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

export type WebhookAuthResult =
  | { ok: true; apiKey: IAnalystApiKey }
  | { ok: false; status: number; message: string };

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function verifyWebhookRequest(
  req: NextRequest,
  rawBody: string,
): Promise<WebhookAuthResult> {
  const keyId = req.headers.get("x-analyst-key");
  const timestampHeader = req.headers.get("x-signal-timestamp");
  const signatureHeader = req.headers.get("x-signal-signature");

  if (!keyId || !timestampHeader || !signatureHeader) {
    return {
      ok: false,
      status: 401,
      message: "Missing authentication headers",
    };
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, status: 401, message: "Invalid timestamp" };
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    return { ok: false, status: 401, message: "Timestamp out of range" };
  }

  const apiKey = await getActiveApiKeyByKeyId(keyId);
  if (!apiKey) {
    return { ok: false, status: 401, message: "Unknown or revoked API key" };
  }

  const secret = decrypt(apiKey.secret_encrypted);
  const expectedSignature = createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  if (!safeEqual(expectedSignature, signatureHeader)) {
    return { ok: false, status: 401, message: "Invalid signature" };
  }

  await touchLastUsed(apiKey.id);

  return { ok: true, apiKey };
}
