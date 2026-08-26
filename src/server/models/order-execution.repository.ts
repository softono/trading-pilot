import { and, eq, sql } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  orderExecutions,
  brokerConnections,
  signals,
  type IOrderExecution,
  type NewOrderExecution,
} from "@/server/models/schema";
import { EXECUTION_STATUS } from "@/modules/broker/broker.constants";

export async function getExecution(
  connectionId: number,
  signalId: number,
): Promise<IOrderExecution | null> {
  const [row] = await db
    .select()
    .from(orderExecutions)
    .where(
      and(
        eq(orderExecutions.connection_id, connectionId),
        eq(orderExecutions.signal_id, signalId),
      ),
    )
    .limit(1);
  return row ?? null;
}

// Race-free reservation: the unique index on (connection_id, signal_id) is the arbiter — a
// concurrent duplicate attempt hits onConflictDoNothing and the caller sees `undefined` back,
// exactly like a 0-row UPDATE would.
export async function reserveExecution(
  data: NewOrderExecution,
): Promise<IOrderExecution | undefined> {
  const [row] = await db
    .insert(orderExecutions)
    .values(data)
    .onConflictDoNothing({
      target: [orderExecutions.connection_id, orderExecutions.signal_id],
    })
    .returning();
  return row;
}

export async function updateExecution(
  id: number,
  data: Partial<NewOrderExecution>,
): Promise<void> {
  await db
    .update(orderExecutions)
    .set({ ...data, updated_at: new Date() })
    .where(eq(orderExecutions.id, id));
}

export async function listOpenExecutionsForSignal(
  signalId: number,
): Promise<IOrderExecution[]> {
  return db
    .select()
    .from(orderExecutions)
    .where(
      and(
        eq(orderExecutions.signal_id, signalId),
        sql`${orderExecutions.status} IN ('placed', 'filled')`,
      ),
    );
}

export async function countStoppedToday(connectionId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orderExecutions)
    .innerJoin(signals, eq(signals.id, orderExecutions.signal_id))
    .where(
      and(
        eq(orderExecutions.connection_id, connectionId),
        eq(signals.status, "STOPPED"),
        sql`${orderExecutions.updated_at} >= current_date`,
      ),
    );
  return Number(row?.count ?? 0);
}

export async function countOpenPositions(
  connectionId: number,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orderExecutions)
    .where(
      and(
        eq(orderExecutions.connection_id, connectionId),
        eq(orderExecutions.status, EXECUTION_STATUS.PLACED),
      ),
    );
  return Number(row?.count ?? 0);
}

export const executionSortMap = {
  created_at: orderExecutions.created_at,
  status: orderExecutions.status,
};

export function listExecutionsForUser(userId: string) {
  return db
    .select({
      id: orderExecutions.id,
      connection_id: orderExecutions.connection_id,
      signal_id: orderExecutions.signal_id,
      status: orderExecutions.status,
      reason: orderExecutions.reason,
      qty: orderExecutions.qty,
      entry_price: orderExecutions.entry_price,
      broker_order_id: orderExecutions.broker_order_id,
      created_at: orderExecutions.created_at,
      symbol: signals.symbol,
      side: signals.side,
      broker: brokerConnections.broker,
    })
    .from(orderExecutions)
    .innerJoin(
      brokerConnections,
      eq(brokerConnections.id, orderExecutions.connection_id),
    )
    .innerJoin(signals, eq(signals.id, orderExecutions.signal_id))
    .where(eq(brokerConnections.user_id, userId))
    .$dynamic();
}

export function listExecutionsAdmin() {
  return db
    .select({
      id: orderExecutions.id,
      connection_id: orderExecutions.connection_id,
      signal_id: orderExecutions.signal_id,
      status: orderExecutions.status,
      reason: orderExecutions.reason,
      qty: orderExecutions.qty,
      created_at: orderExecutions.created_at,
      symbol: signals.symbol,
      broker: brokerConnections.broker,
    })
    .from(orderExecutions)
    .innerJoin(
      brokerConnections,
      eq(brokerConnections.id, orderExecutions.connection_id),
    )
    .innerJoin(signals, eq(signals.id, orderExecutions.signal_id))
    .$dynamic();
}
