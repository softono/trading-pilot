import { and, eq } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  subscriptions,
  analystProfiles,
  type ISubscription,
  type NewSubscription,
} from "@/server/models/schema";
import { SUBSCRIPTION_STATUS } from "@/modules/subscription/subscription.constants";

export async function getSubscription(
  userId: string,
  analystId: string,
): Promise<ISubscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.user_id, userId),
        eq(subscriptions.analyst_id, analystId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function isActiveSubscriber(
  userId: string,
  analystId: string,
): Promise<boolean> {
  const row = await getSubscription(userId, analystId);
  return row?.status === SUBSCRIPTION_STATUS.ACTIVE;
}

export async function upsertSubscription(
  data: NewSubscription,
): Promise<ISubscription> {
  const [row] = await db
    .insert(subscriptions)
    .values(data)
    .onConflictDoUpdate({
      target: [subscriptions.user_id, subscriptions.analyst_id],
      set: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        started_at: new Date(),
        cancelled_at: null,
      },
    })
    .returning();
  return row;
}

export async function cancelSubscription(
  userId: string,
  analystId: string,
): Promise<ISubscription | null> {
  const [row] = await db
    .update(subscriptions)
    .set({ status: SUBSCRIPTION_STATUS.CANCELLED, cancelled_at: new Date() })
    .where(
      and(
        eq(subscriptions.user_id, userId),
        eq(subscriptions.analyst_id, analystId),
      ),
    )
    .returning();
  return row ?? null;
}

export function listMySubscriptions(userId: string) {
  return db
    .select({
      id: subscriptions.id,
      analyst_id: subscriptions.analyst_id,
      status: subscriptions.status,
      started_at: subscriptions.started_at,
      cancelled_at: subscriptions.cancelled_at,
      analyst_name: analystProfiles.display_name,
      analyst_slug: analystProfiles.slug,
      analyst_avatar: analystProfiles.avatar,
    })
    .from(subscriptions)
    .innerJoin(
      analystProfiles,
      eq(analystProfiles.user_id, subscriptions.analyst_id),
    )
    .where(
      and(
        eq(subscriptions.user_id, userId),
        eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
      ),
    )
    .$dynamic();
}
