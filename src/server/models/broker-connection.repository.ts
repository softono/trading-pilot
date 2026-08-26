import { and, eq } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  brokerConnections,
  type IBrokerConnection,
  type NewBrokerConnection,
} from "@/server/models/schema";

export function listConnectionsForUser(userId: string) {
  return db
    .select()
    .from(brokerConnections)
    .where(eq(brokerConnections.user_id, userId))
    .$dynamic();
}

export async function getConnectionForUser(
  id: number,
  userId: string,
): Promise<IBrokerConnection | null> {
  const [row] = await db
    .select()
    .from(brokerConnections)
    .where(
      and(eq(brokerConnections.id, id), eq(brokerConnections.user_id, userId)),
    )
    .limit(1);
  return row ?? null;
}

export async function getConnectionById(
  id: number,
): Promise<IBrokerConnection | null> {
  const [row] = await db
    .select()
    .from(brokerConnections)
    .where(eq(brokerConnections.id, id))
    .limit(1);
  return row ?? null;
}

export function listVerifiedEnabledConnections() {
  return db
    .select()
    .from(brokerConnections)
    .where(
      and(
        eq(brokerConnections.is_enabled, true),
        eq(brokerConnections.status, "verified"),
      ),
    )
    .$dynamic();
}

export function listEnabledConnectionsForBroker(broker: string) {
  return db
    .select()
    .from(brokerConnections)
    .where(
      and(
        eq(brokerConnections.broker, broker),
        eq(brokerConnections.is_enabled, true),
      ),
    )
    .$dynamic();
}

export async function createConnection(
  data: NewBrokerConnection,
): Promise<IBrokerConnection> {
  const [row] = await db.insert(brokerConnections).values(data).returning();
  return row;
}

export async function updateConnectionForUser(
  id: number,
  userId: string,
  data: Partial<NewBrokerConnection>,
): Promise<IBrokerConnection | null> {
  const [row] = await db
    .update(brokerConnections)
    .set({ ...data, updated_at: new Date() })
    .where(
      and(eq(brokerConnections.id, id), eq(brokerConnections.user_id, userId)),
    )
    .returning();
  return row ?? null;
}

export async function deleteConnectionForUser(
  id: number,
  userId: string,
): Promise<IBrokerConnection | null> {
  const [row] = await db
    .delete(brokerConnections)
    .where(
      and(eq(brokerConnections.id, id), eq(brokerConnections.user_id, userId)),
    )
    .returning();
  return row ?? null;
}
