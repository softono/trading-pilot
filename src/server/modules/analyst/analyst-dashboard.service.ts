import { and, desc, eq, sql } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  signals,
  analystApiKeys,
  webhookLogs,
  subscriptions,
} from "@/server/models/schema";
import { SUBSCRIPTION_STATUS } from "@/modules/subscription/subscription.constants";
import { dateTimeFormat } from "@/server/lib/date";
import type { ApiResult } from "@/types";

export async function getAnalystDashboardStats(
  analystId: string,
  tz: string,
): Promise<ApiResult> {
  const [signalsCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(signals)
    .where(eq(signals.analyst_id, analystId));

  const [subscriberCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.analyst_id, analystId),
        eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
      ),
    );

  const keys = await db
    .select()
    .from(analystApiKeys)
    .where(eq(analystApiKeys.user_id, analystId));
  const activeKeys = keys.filter((k) => !k.revoked_at);
  const keyIds = keys.map((k) => k.key_id);

  const [lastSignalRow] = await db
    .select({ created_at: signals.created_at })
    .from(signals)
    .where(eq(signals.analyst_id, analystId))
    .orderBy(desc(signals.created_at))
    .limit(1);

  let lastWebhookError: { message: string; created_at: Date } | null = null;
  if (keyIds.length > 0) {
    const [row] = await db
      .select({ error: webhookLogs.error, created_at: webhookLogs.created_at })
      .from(webhookLogs)
      .where(
        and(
          sql`${webhookLogs.key_id} = ANY(${keyIds})`,
          sql`${webhookLogs.error} IS NOT NULL`,
        ),
      )
      .orderBy(desc(webhookLogs.created_at))
      .limit(1);
    if (row?.error)
      lastWebhookError = { message: row.error, created_at: row.created_at };
  }

  return {
    http_status: 200,
    status: 1,
    message: "Analyst dashboard stats retrieved successfully",
    data: {
      signalsCount: Number(signalsCountRow?.count ?? 0),
      subscriberCount: Number(subscriberCountRow?.count ?? 0),
      activeApiKeys: activeKeys.length,
      totalApiKeys: keys.length,
      lastSignalReceivedAt: lastSignalRow?.created_at
        ? dateTimeFormat(lastSignalRow.created_at, tz)
        : null,
      lastWebhookError: lastWebhookError
        ? {
            message: lastWebhookError.message,
            occurredAt: dateTimeFormat(lastWebhookError.created_at, tz),
          }
        : null,
    },
  };
}
