import { and, eq } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  brokerInstruments,
  type IBrokerInstrument,
  type NewBrokerInstrument,
} from "@/server/models/schema";

export async function findInstrument(
  broker: string,
  exchange: string,
  symbol: string,
): Promise<IBrokerInstrument | null> {
  const [row] = await db
    .select()
    .from(brokerInstruments)
    .where(
      and(
        eq(brokerInstruments.broker, broker),
        eq(brokerInstruments.exchange, exchange),
        eq(brokerInstruments.symbol, symbol),
        eq(brokerInstruments.is_active, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function upsertInstrument(
  data: NewBrokerInstrument,
): Promise<void> {
  await db
    .insert(brokerInstruments)
    .values(data)
    .onConflictDoUpdate({
      target: [
        brokerInstruments.broker,
        brokerInstruments.exchange,
        brokerInstruments.symbol,
      ],
      set: {
        broker_symbol: data.broker_symbol,
        broker_token: data.broker_token,
        lot_size: data.lot_size,
        tick_size: data.tick_size,
        is_active: true,
        synced_at: data.synced_at,
      },
    });
}
