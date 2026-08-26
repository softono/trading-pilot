import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { withPublic } from "@/server/middleware/withPublic";
import { rateLimit } from "@/server/lib/rateLimit";
import { getClientIp } from "@/server/utils/clientInfo";
import { validateData } from "@/server/lib/validator";
import { signalWebhookSchema } from "@/modules/signal/signal.validator";
import { verifyWebhookRequest } from "@/server/modules/signal/webhook-auth";
import { processWebhookSignal } from "@/server/modules/signal/signal.service";
import { logWebhookAttempt } from "@/server/models/webhook-log.repository";

async function handler(req: NextRequest) {
  const ip = getClientIp(req);
  const keyId = req.headers.get("x-analyst-key");

  const rl = await rateLimit(`webhook:signals:${keyId || ip}`, 60, 60);
  if (!rl.status) {
    await logWebhookAttempt({
      key_id: keyId,
      ip,
      http_status: 429,
      error: "rate limited",
    });
    return sendError(429, rl.message || "Too many requests");
  }

  const rawBody = await req.text();

  const auth = await verifyWebhookRequest(req, rawBody);
  if (!auth.ok) {
    await logWebhookAttempt({
      key_id: keyId,
      ip,
      http_status: auth.status,
      error: auth.message,
    });
    return sendError(auth.status, auth.message);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    await logWebhookAttempt({
      key_id: keyId,
      ip,
      http_status: 400,
      error: "invalid JSON body",
    });
    return sendError(400, "Invalid JSON body");
  }

  const validated = validateData(signalWebhookSchema, body);
  if (!validated.status) {
    const partial = body as { event?: string; logical_signal_id?: string };
    await logWebhookAttempt({
      key_id: keyId,
      ip,
      event: partial?.event,
      logical_signal_id: partial?.logical_signal_id,
      http_status: validated.http_status,
      error: validated.message,
    });
    return sendResult(validated);
  }

  const result = await processWebhookSignal(
    auth.apiKey.user_id,
    validated.data,
  );

  await logWebhookAttempt({
    key_id: keyId,
    ip,
    event: validated.data.event,
    logical_signal_id: validated.data.logical_signal_id,
    http_status: result.http_status ?? 200,
    error: result.status === 0 ? result.message : null,
  });

  return sendResult(result);
}

export const POST = withPublic(handler);
