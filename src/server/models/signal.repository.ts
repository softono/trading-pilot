import { and, eq, ilike, or } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  signals,
  analystProfiles,
  type ISignal,
  type NewSignal,
} from "@/server/models/schema";

export const signalSortMap = {
  symbol: signals.symbol,
  status: signals.status,
  published_at: signals.published_at,
  created_at: signals.created_at,
};

export async function getSignalByAnalystAndLogicalId(
  analystId: string,
  logicalSignalId: string,
): Promise<ISignal | null> {
  const [row] = await db
    .select()
    .from(signals)
    .where(
      and(
        eq(signals.analyst_id, analystId),
        eq(signals.logical_signal_id, logicalSignalId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getSignalById(id: number): Promise<ISignal | null> {
  const [row] = await db
    .select()
    .from(signals)
    .where(eq(signals.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertSignal(data: NewSignal): Promise<ISignal> {
  const [row] = await db.insert(signals).values(data).returning();
  return row;
}

export async function updateSignal(
  id: number,
  data: Partial<NewSignal>,
): Promise<ISignal | null> {
  const [row] = await db
    .update(signals)
    .set({ ...data, updated_at: new Date() })
    .where(eq(signals.id, id))
    .returning();
  return row ?? null;
}

export function listSignalsAdmin(search?: string) {
  const conditions = [];
  if (search) {
    conditions.push(ilike(signals.symbol, `%${search}%`));
  }

  return db
    .select({
      id: signals.id,
      analyst_id: signals.analyst_id,
      symbol: signals.symbol,
      side: signals.side,
      horizon: signals.horizon,
      status: signals.status,
      published_at: signals.published_at,
      created_at: signals.created_at,
      analyst_name: analystProfiles.display_name,
    })
    .from(signals)
    .leftJoin(analystProfiles, eq(analystProfiles.user_id, signals.analyst_id))
    .where(conditions.length ? and(...conditions) : undefined)
    .$dynamic();
}

const PUBLIC_STATUSES = [
  "PUBLISHED",
  "ACTIVE",
  "TARGET_REACHED",
  "STOPPED",
  "FAILED",
  "EXPIRED",
];

export function listPublicSignals(search?: string) {
  const conditions = [or(...PUBLIC_STATUSES.map((s) => eq(signals.status, s)))];
  if (search) {
    conditions.push(ilike(signals.symbol, `%${search}%`));
  }

  return db
    .select({
      id: signals.id,
      analyst_id: signals.analyst_id,
      symbol: signals.symbol,
      company_name: signals.company_name,
      exchange: signals.exchange,
      side: signals.side,
      horizon: signals.horizon,
      setup_code: signals.setup_code,
      status: signals.status,
      event_risk: signals.event_risk,
      published_at: signals.published_at,
      analyst_name: analystProfiles.display_name,
      analyst_slug: analystProfiles.slug,
    })
    .from(signals)
    .innerJoin(analystProfiles, eq(analystProfiles.user_id, signals.analyst_id))
    .where(and(...conditions))
    .$dynamic();
}

export async function getPublicSignalById(id: number) {
  const [row] = await db
    .select({
      id: signals.id,
      analyst_id: signals.analyst_id,
      symbol: signals.symbol,
      company_name: signals.company_name,
      exchange: signals.exchange,
      market: signals.market,
      instrument_class: signals.instrument_class,
      side: signals.side,
      horizon: signals.horizon,
      timeframe: signals.timeframe,
      setup_code: signals.setup_code,
      entry: signals.entry,
      stop_loss: signals.stop_loss,
      targets: signals.targets,
      risk_score: signals.risk_score,
      confidence: signals.confidence,
      ai_confidence: signals.ai_confidence,
      event_risk: signals.event_risk,
      thesis_pack: signals.thesis_pack,
      key_risks: signals.key_risks,
      status: signals.status,
      detected_at: signals.detected_at,
      published_at: signals.published_at,
      exit_price: signals.exit_price,
      exit_reason: signals.exit_reason,
      closed_at: signals.closed_at,
      analyst_name: analystProfiles.display_name,
      analyst_slug: analystProfiles.slug,
    })
    .from(signals)
    .innerJoin(analystProfiles, eq(analystProfiles.user_id, signals.analyst_id))
    .where(
      and(
        eq(signals.id, id),
        or(...PUBLIC_STATUSES.map((s) => eq(signals.status, s))),
      ),
    )
    .limit(1);
  return row ?? null;
}
