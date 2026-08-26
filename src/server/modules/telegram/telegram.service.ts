import { getSetting } from "@/server/modules/setting/settings.service";

export interface TelegramSendResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyToMessageId?: number,
): Promise<TelegramSendResult> {
  const token = await getSetting("telegram_bot_token");
  if (!token) {
    return { ok: false, error: "telegram_bot_token not configured" };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          ...(replyToMessageId
            ? { reply_to_message_id: replyToMessageId }
            : {}),
        }),
      },
    );

    const json = (await res.json()) as {
      ok: boolean;
      result?: { message_id: number };
      description?: string;
    };

    if (!res.ok || !json.ok) {
      return { ok: false, error: json.description || `HTTP ${res.status}` };
    }

    return { ok: true, messageId: json.result?.message_id };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
