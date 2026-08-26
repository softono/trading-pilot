import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "@/server/models/user";
import { SUBSCRIPTION_STATUS } from "@/modules/subscription/subscription.constants";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    analyst_id: text("analyst_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default(SUBSCRIPTION_STATUS.ACTIVE),
    // Nullable — Phase 2 (pricing) fills these in. Every analyst is free in Phase 1.
    plan_id: text("plan_id"),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    started_at: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("subscriptions_user_analyst_unique").on(
      t.user_id,
      t.analyst_id,
    ),
    index("subscriptions_analyst_idx").on(t.analyst_id),
  ],
);

export type ISubscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export default subscriptions;
