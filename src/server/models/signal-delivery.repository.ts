import { eq } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  signalDeliveries,
  type ISignalDelivery,
  type NewSignalDelivery,
} from "@/server/models/schema";

export async function createDelivery(
  data: NewSignalDelivery,
): Promise<ISignalDelivery> {
  const [row] = await db.insert(signalDeliveries).values(data).returning();
  return row;
}

export async function updateDelivery(
  id: number,
  data: Partial<NewSignalDelivery>,
): Promise<void> {
  await db
    .update(signalDeliveries)
    .set({ ...data, updated_at: new Date() })
    .where(eq(signalDeliveries.id, id));
}
