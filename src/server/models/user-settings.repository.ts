import { eq } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  userSettings,
  type IUserSettings,
  type NewUserSettings,
} from "@/server/models/schema";

export async function getSettingsForUser(
  userId: string,
): Promise<IUserSettings | null> {
  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.user_id, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertSettingsForUser(
  userId: string,
  data: Partial<NewUserSettings>,
): Promise<IUserSettings> {
  const existing = await getSettingsForUser(userId);
  if (existing) {
    const [row] = await db
      .update(userSettings)
      .set({ ...data, updated_at: new Date() })
      .where(eq(userSettings.user_id, userId))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(userSettings)
    .values({ user_id: userId, ...data })
    .returning();
  return row;
}
