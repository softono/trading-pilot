import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { signals } from "@/server/models/signal";

export const signalEvents = pgTable(
  "signal_events",
  {
    id: serial("id").primaryKey(),
    signal_id: integer("signal_id")
      .notNull()
      .references(() => signals.id, { onDelete: "cascade" }),
    from_status: text("from_status"),
    to_status: text("to_status").notNull(),
    reason: text("reason"),
    occurred_at: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("signal_events_signal_idx").on(t.signal_id)],
);

export type ISignalEvent = typeof signalEvents.$inferSelect;
export type NewSignalEvent = typeof signalEvents.$inferInsert;

export default signalEvents;
