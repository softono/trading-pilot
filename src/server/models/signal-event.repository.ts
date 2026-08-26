import { eq } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  signalEvents,
  type ISignalEvent,
  type NewSignalEvent,
} from "@/server/models/schema";

export async function createSignalEvent(
  data: NewSignalEvent,
): Promise<ISignalEvent> {
  const [row] = await db.insert(signalEvents).values(data).returning();
  return row;
}

export async function listEventsForSignal(
  signalId: number,
): Promise<ISignalEvent[]> {
  return db
    .select()
    .from(signalEvents)
    .where(eq(signalEvents.signal_id, signalId))
    .orderBy(signalEvents.occurred_at);
}
