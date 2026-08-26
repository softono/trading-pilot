import {
  pgTable,
  serial,
  text,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "@/server/models/user";

export const userSettings = pgTable(
  "user_settings",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    webhook_enabled: boolean("webhook_enabled").notNull().default(true),
    allowed_ips: jsonb("allowed_ips").$type<string[]>().default([]),
    telegram_enabled: boolean("telegram_enabled").notNull().default(false),
    telegram_channel_id: text("telegram_channel_id"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("user_settings_user_unique").on(t.user_id)],
);

export type IUserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export default userSettings;
