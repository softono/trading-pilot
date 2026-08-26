import {
  getSubscription,
  upsertSubscription,
  cancelSubscription,
  listMySubscriptions,
} from "@/server/models/subscription.repository";
import { getProfileByUserId } from "@/server/models/analyst-profile.repository";
import { getFileUrl } from "@/server/lib/file";
import { dateTimeFormat } from "@/server/lib/date";
import { Pagination } from "@/server/lib/pagination";
import { subscriptions } from "@/server/models/schema";
import { SUBSCRIPTION_STATUS } from "@/modules/subscription/subscription.constants";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";

export async function subscribe(
  userId: string,
  analystId: string,
): Promise<ApiResult> {
  if (userId === analystId) {
    return {
      http_status: 400,
      status: 0,
      message: "You cannot subscribe to yourself",
    };
  }

  const profile = await getProfileByUserId(analystId);
  if (!profile || !profile.is_public) {
    return { http_status: 404, status: 0, message: "Analyst not found" };
  }

  const row = await upsertSubscription({
    user_id: userId,
    analyst_id: analystId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });

  return {
    http_status: 201,
    status: 1,
    message: "Subscribed successfully",
    data: row,
  };
}

export async function unsubscribe(
  userId: string,
  analystId: string,
): Promise<ApiResult> {
  const row = await cancelSubscription(userId, analystId);
  if (!row) {
    return { http_status: 404, status: 0, message: "Subscription not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Unsubscribed successfully",
  };
}

export async function isSubscribed(
  userId: string | undefined,
  analystId: string,
): Promise<boolean> {
  if (!userId) return false;
  const row = await getSubscription(userId, analystId);
  return row?.status === SUBSCRIPTION_STATUS.ACTIVE;
}

const subscriptionSortMap = {
  started_at: subscriptions.started_at,
};

export async function listMySubscriptionsService(
  userId: string,
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listMySubscriptions(userId);

  return Pagination.paginate(query, body, subscriptionSortMap, {
    defaultSort: { field: "started_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      analyst_avatar: row.analyst_avatar
        ? getFileUrl(row.analyst_avatar)
        : null,
      started_at: row.started_at
        ? dateTimeFormat(row.started_at as Date, tz)
        : null,
    }),
  });
}
