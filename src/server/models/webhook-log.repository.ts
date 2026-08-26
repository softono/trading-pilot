import db from "@/server/lib/db";
import { webhookLogs, type NewWebhookLog } from "@/server/models/schema";
import { errorLog } from "@/server/lib/logger";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Best-effort audit log — a malformed inbound payload (e.g. a non-UUID
// logical_signal_id) must never take down the webhook response itself.
export async function logWebhookAttempt(data: NewWebhookLog): Promise<void> {
  try {
    await db.insert(webhookLogs).values({
      ...data,
      logical_signal_id:
        data.logical_signal_id && UUID_RE.test(data.logical_signal_id)
          ? data.logical_signal_id
          : null,
    });
  } catch (error: unknown) {
    errorLog(
      `webhook_logs insert failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
