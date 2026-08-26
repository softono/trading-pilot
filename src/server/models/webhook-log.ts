import {
  pgTable,
  serial,
  text,
  uuid,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const webhookLogs = pgTable(
  "webhook_logs",
  {
    id: serial("id").primaryKey(),
    key_id: text("key_id"),
    ip: text("ip"),
    event: text("event"),
    logical_signal_id: uuid("logical_signal_id"),
    http_status: integer("http_status").notNull(),
    error: text("error"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("webhook_logs_key_idx").on(t.key_id)],
);

export type IWebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;

export default webhookLogs;
