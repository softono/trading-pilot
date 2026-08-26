import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "@/server/models/user";
import { CONNECTION_STATUS } from "@/modules/broker/broker.constants";

export const brokerConnections = pgTable(
  "broker_connections",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    broker: text("broker").notNull(),
    mode: text("mode").notNull(),
    label: text("label"),
    // AES-256-GCM encrypted JSON blob (lib/encryption.ts) — per-adapter credential shape, opaque
    // here. Empty for the paper broker (no real credentials to hold).
    credentials: text("credentials"),
    status: text("status").notNull().default(CONNECTION_STATUS.UNVERIFIED),
    verified_at: timestamp("verified_at", { withTimezone: true }),
    last_error: text("last_error"),
    is_enabled: boolean("is_enabled").notNull().default(true),

    risk_per_trade: numeric("risk_per_trade", {
      precision: 14,
      scale: 2,
    }).notNull(),
    capital: numeric("capital", { precision: 16, scale: 2 }),
    max_qty: integer("max_qty"),
    max_position_value: numeric("max_position_value", {
      precision: 16,
      scale: 2,
    }),
    max_open_positions: integer("max_open_positions"),
    daily_loss_cap: numeric("daily_loss_cap", { precision: 14, scale: 2 }),
    max_signal_age_minutes: integer("max_signal_age_minutes")
      .notNull()
      .default(15),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("broker_connections_user_idx").on(t.user_id)],
);

export type IBrokerConnection = typeof brokerConnections.$inferSelect;
export type NewBrokerConnection = typeof brokerConnections.$inferInsert;

export default brokerConnections;
