import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { brokerConnections } from "@/server/models/broker-connection";
import { signals } from "@/server/models/signal";
import { EXECUTION_STATUS } from "@/modules/broker/broker.constants";

export const orderExecutions = pgTable(
  "order_executions",
  {
    id: serial("id").primaryKey(),
    connection_id: integer("connection_id")
      .notNull()
      .references(() => brokerConnections.id, { onDelete: "cascade" }),
    signal_id: integer("signal_id")
      .notNull()
      .references(() => signals.id, { onDelete: "cascade" }),
    status: text("status").notNull().default(EXECUTION_STATUS.PENDING),
    reason: text("reason"),
    qty: integer("qty"),
    entry_price: numeric("entry_price", { precision: 18, scale: 4 }),
    broker_order_id: text("broker_order_id"),
    stop_order_id: text("stop_order_id"),
    attempts: integer("attempts").notNull().default(0),
    raw: jsonb("raw").default({}),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // The dedupe guarantee — one execution attempt per (connection, signal), regardless of how
    // many times the signal's webhook or a retry sweep tries to act on it.
    uniqueIndex("order_executions_connection_signal_unique").on(
      t.connection_id,
      t.signal_id,
    ),
    index("order_executions_signal_idx").on(t.signal_id),
  ],
);

export type IOrderExecution = typeof orderExecutions.$inferSelect;
export type NewOrderExecution = typeof orderExecutions.$inferInsert;

export default orderExecutions;
