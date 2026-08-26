import {
  pgTable,
  serial,
  text,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "@/server/models/user";

// Status vocabulary mirrors the upstream trading engine's state machine
// (CONFIRMED -> ... -> PUBLISHED -> ACTIVE -> TARGET_REACHED/STOPPED/FAILED/EXPIRED).
// Kept as free text (no pgEnum / CHECK) so it can track the upstream vocabulary
// without a migration every time it changes.
export const signals = pgTable(
  "signals",
  {
    id: serial("id").primaryKey(),
    analyst_id: text("analyst_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logical_signal_id: uuid("logical_signal_id").notNull(),
    revision_no: integer("revision_no").notNull().default(1),

    symbol: text("symbol").notNull(),
    company_name: text("company_name"),
    exchange: text("exchange"),
    market: text("market").notNull(),
    instrument_class: text("instrument_class").notNull(),
    side: text("side").notNull(),
    horizon: text("horizon"),
    timeframe: text("timeframe"),
    setup_code: text("setup_code"),

    entry: numeric("entry", { precision: 18, scale: 4 }).notNull(),
    stop_loss: numeric("stop_loss", { precision: 18, scale: 4 }).notNull(),
    targets: jsonb("targets").$type<unknown[]>().default([]),

    risk_score: numeric("risk_score", { precision: 5, scale: 2 }),
    confidence: numeric("confidence", { precision: 5, scale: 2 }),
    ai_confidence: numeric("ai_confidence", { precision: 5, scale: 2 }),
    event_risk: boolean("event_risk").default(false),
    ttl_expires_at: timestamp("ttl_expires_at", { withTimezone: true }),

    thesis_pack: jsonb("thesis_pack").default({}),
    key_risks: jsonb("key_risks").default([]),
    evidence: jsonb("evidence").default({}),

    status: text("status").notNull(),
    detected_at: timestamp("detected_at", { withTimezone: true }),
    published_at: timestamp("published_at", { withTimezone: true }),
    invalidated_at: timestamp("invalidated_at", { withTimezone: true }),
    invalidation_reason: text("invalidation_reason"),

    // Phase 2 — performance analytics. Never written or computed in Phase 1.
    exit_price: numeric("exit_price", { precision: 18, scale: 4 }),
    exit_reason: text("exit_reason"),
    return_pct: numeric("return_pct", { precision: 8, scale: 4 }),
    r_multiple: numeric("r_multiple", { precision: 8, scale: 4 }),
    closed_at: timestamp("closed_at", { withTimezone: true }),

    payload: jsonb("payload").notNull(),
    telegram_message_id: text("telegram_message_id"),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("signals_analyst_logical_unique").on(
      t.analyst_id,
      t.logical_signal_id,
    ),
    index("signals_analyst_published_idx").on(
      t.analyst_id,
      t.published_at.desc(),
    ),
    index("signals_status_idx").on(t.status),
  ],
);

export type ISignal = typeof signals.$inferSelect;
export type NewSignal = typeof signals.$inferInsert;

export default signals;
