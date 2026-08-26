import { and, eq, isNull } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  analystApiKeys,
  type IAnalystApiKey,
  type NewAnalystApiKey,
} from "@/server/models/schema";

export const apiKeySortMap = {
  label: analystApiKeys.label,
  created_at: analystApiKeys.created_at,
  last_used_at: analystApiKeys.last_used_at,
};

export function listApiKeysForUser(userId: string) {
  return db
    .select({
      id: analystApiKeys.id,
      key_id: analystApiKeys.key_id,
      label: analystApiKeys.label,
      last_used_at: analystApiKeys.last_used_at,
      revoked_at: analystApiKeys.revoked_at,
      created_at: analystApiKeys.created_at,
    })
    .from(analystApiKeys)
    .where(eq(analystApiKeys.user_id, userId))
    .$dynamic();
}

export async function getActiveApiKeyByKeyId(
  keyId: string,
): Promise<IAnalystApiKey | null> {
  const [row] = await db
    .select()
    .from(analystApiKeys)
    .where(
      and(eq(analystApiKeys.key_id, keyId), isNull(analystApiKeys.revoked_at)),
    )
    .limit(1);
  return row ?? null;
}

export async function createApiKey(
  data: NewAnalystApiKey,
): Promise<IAnalystApiKey> {
  const [row] = await db.insert(analystApiKeys).values(data).returning();
  return row;
}

export async function revokeApiKeyForUser(
  id: number,
  userId: string,
): Promise<IAnalystApiKey | null> {
  const [row] = await db
    .update(analystApiKeys)
    .set({ revoked_at: new Date() })
    .where(and(eq(analystApiKeys.id, id), eq(analystApiKeys.user_id, userId)))
    .returning();
  return row ?? null;
}

export async function touchLastUsed(id: number): Promise<void> {
  await db
    .update(analystApiKeys)
    .set({ last_used_at: new Date() })
    .where(eq(analystApiKeys.id, id));
}
