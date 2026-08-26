import {
  pgTable,
  serial,
  text,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const brokerInstruments = pgTable(
  "broker_instruments",
  {
    id: serial("id").primaryKey(),
    broker: text("broker").notNull(),
    exchange: text("exchange").notNull(),
    symbol: text("symbol").notNull(),
    broker_symbol: text("broker_symbol"),
    broker_token: text("broker_token"),
    lot_size: numeric("lot_size", { precision: 12, scale: 4 }),
    tick_size: numeric("tick_size", { precision: 12, scale: 4 }),
    instrument_class: text("instrument_class").notNull(),
    is_active: boolean("is_active").notNull().default(true),
    synced_at: timestamp("synced_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("broker_instruments_unique").on(t.broker, t.exchange, t.symbol),
  ],
);

export type IBrokerInstrument = typeof brokerInstruments.$inferSelect;
export type NewBrokerInstrument = typeof brokerInstruments.$inferInsert;

export default brokerInstruments;
