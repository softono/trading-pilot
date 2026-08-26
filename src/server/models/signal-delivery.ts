import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { signals } from "@/server/models/signal";

export const signalDeliveries = pgTable(
  "signal_deliveries",
  {
    id: serial("id").primaryKey(),
    signal_id: integer("signal_id")
      .notNull()
      .references(() => signals.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(), // telegram
    target: text("target"), // channel id / chat id
    status: text("status").notNull().default("pending"), // pending | sent | failed | skipped
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("signal_deliveries_signal_idx").on(t.signal_id)],
);

export type ISignalDelivery = typeof signalDeliveries.$inferSelect;
export type NewSignalDelivery = typeof signalDeliveries.$inferInsert;

export default signalDeliveries;
