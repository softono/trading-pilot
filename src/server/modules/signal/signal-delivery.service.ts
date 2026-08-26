import { getSignalById, updateSignal } from "@/server/models/signal.repository";
import { getSettingsForUser } from "@/server/models/user-settings.repository";
import { getProfileByUserId } from "@/server/models/analyst-profile.repository";
import {
  createDelivery,
  updateDelivery,
} from "@/server/models/signal-delivery.repository";
import { sendTelegramMessage } from "@/server/modules/telegram/telegram.service";
import { infoLog } from "@/server/lib/logger";
import { SIGNAL_STATUS } from "@/modules/signal/signal.constants";

const TERMINAL_OUTCOME_STATUSES: string[] = [
  SIGNAL_STATUS.TARGET_REACHED,
  SIGNAL_STATUS.STOPPED,
  SIGNAL_STATUS.FAILED,
  SIGNAL_STATUS.EXPIRED,
];

function formatPublishedMessage(
  symbol: string,
  side: string,
  horizon: string | null,
  setupCode: string | null,
  entry: string,
  stopLoss: string,
  targets: unknown,
  analystName: string,
): string {
  const targetLevels = Array.isArray(targets)
    ? targets
        .map((t) => (t as { level?: number })?.level)
        .filter((v) => v !== undefined)
        .join(", ")
    : "";

  return [
    `<b>${symbol} — ${side.toUpperCase()}</b>${horizon ? ` (${horizon})` : ""}${setupCode ? ` · ${setupCode}` : ""}`,
    `Entry: ${entry}`,
    `Stop Loss: ${stopLoss}`,
    targetLevels ? `Targets: ${targetLevels}` : "",
    `— ${analystName}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatOutcomeMessage(
  status: string,
  exitPrice: string | null,
): string {
  const label: Record<string, string> = {
    TARGET_REACHED: "🎯 Target reached",
    STOPPED: "🛑 Stopped out",
    FAILED: "❌ Failed",
    EXPIRED: "⌛ Expired",
  };
  const prefix = label[status] ?? status;
  return exitPrice ? `${prefix} at ${exitPrice}` : prefix;
}

/** The `signal.deliver` worker's job body — one signal, one channel (Telegram), one delivery
 * attempt. Never throws for a "not configured"/"disabled" case (that's a legitimate skip, not a
 * failure); only a genuine send error propagates so BullMQ retries it. */
export async function deliverSignalToTelegram(signalId: number): Promise<void> {
  const signal = await getSignalById(signalId);
  if (!signal) return;

  const settings = await getSettingsForUser(signal.analyst_id);
  if (!settings?.telegram_enabled || !settings.telegram_channel_id) {
    await createDelivery({
      signal_id: signalId,
      channel: "telegram",
      target: settings?.telegram_channel_id ?? null,
      status: "skipped",
      error: "telegram not enabled or no channel configured",
    });
    return;
  }

  const isOutcome = TERMINAL_OUTCOME_STATUSES.includes(signal.status);
  if (isOutcome && !signal.telegram_message_id) {
    // No original message to reply to (e.g. delivery was disabled at publish time) — nothing
    // meaningful to post.
    await createDelivery({
      signal_id: signalId,
      channel: "telegram",
      target: settings.telegram_channel_id,
      status: "skipped",
      error: "no original message to reply to",
    });
    return;
  }

  const profile = await getProfileByUserId(signal.analyst_id);
  const text = isOutcome
    ? formatOutcomeMessage(signal.status, signal.exit_price)
    : formatPublishedMessage(
        signal.symbol,
        signal.side,
        signal.horizon,
        signal.setup_code,
        signal.entry,
        signal.stop_loss,
        signal.targets,
        profile?.display_name ?? "Analyst",
      );

  const delivery = await createDelivery({
    signal_id: signalId,
    channel: "telegram",
    target: settings.telegram_channel_id,
    status: "pending",
    attempts: 1,
  });

  const result = await sendTelegramMessage(
    settings.telegram_channel_id,
    text,
    isOutcome
      ? signal.telegram_message_id
        ? Number(signal.telegram_message_id)
        : undefined
      : undefined,
  );

  if (!result.ok) {
    await updateDelivery(delivery.id, {
      status: "failed",
      error: result.error,
    });
    throw new Error(result.error || "telegram send failed");
  }

  await updateDelivery(delivery.id, {
    status: "sent",
    delivered_at: new Date(),
  });

  if (!isOutcome && result.messageId) {
    await updateSignal(signalId, {
      telegram_message_id: String(result.messageId),
    });
  }

  infoLog("signal delivered to telegram", { signalId, status: signal.status });
}
