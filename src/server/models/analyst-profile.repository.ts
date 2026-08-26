import { and, eq, ilike, or } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  analystProfiles,
  users,
  type IAnalystProfile,
  type NewAnalystProfile,
} from "@/server/models/schema";

export const analystProfileSortMap = {
  display_name: analystProfiles.display_name,
  analyst_type: analystProfiles.analyst_type,
  created_at: analystProfiles.created_at,
};

export function listAnalystProfiles(search?: string) {
  const conditions = [];
  if (search) {
    const like = `%${search}%`;
    const searchCond = or(
      ilike(analystProfiles.display_name, like),
      ilike(users.email, like),
    );
    if (searchCond) conditions.push(searchCond);
  }

  return db
    .select({
      id: analystProfiles.id,
      user_id: analystProfiles.user_id,
      slug: analystProfiles.slug,
      display_name: analystProfiles.display_name,
      headline: analystProfiles.headline,
      avatar: analystProfiles.avatar,
      analyst_type: analystProfiles.analyst_type,
      is_public: analystProfiles.is_public,
      created_at: analystProfiles.created_at,
      email: users.email,
    })
    .from(analystProfiles)
    .innerJoin(users, eq(users.id, analystProfiles.user_id))
    .where(conditions.length ? and(...conditions) : undefined)
    .$dynamic();
}

export function listPublicAnalystProfiles() {
  return db
    .select({
      id: analystProfiles.id,
      slug: analystProfiles.slug,
      display_name: analystProfiles.display_name,
      headline: analystProfiles.headline,
      avatar: analystProfiles.avatar,
      analyst_type: analystProfiles.analyst_type,
      specialties: analystProfiles.specialties,
    })
    .from(analystProfiles)
    .where(eq(analystProfiles.is_public, true))
    .$dynamic();
}

export async function getProfileByUserId(
  userId: string,
): Promise<IAnalystProfile | null> {
  const [row] = await db
    .select()
    .from(analystProfiles)
    .where(eq(analystProfiles.user_id, userId))
    .limit(1);
  return row ?? null;
}

export async function getProfileBySlug(
  slug: string,
): Promise<IAnalystProfile | null> {
  const [row] = await db
    .select()
    .from(analystProfiles)
    .where(eq(analystProfiles.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function slugExists(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: analystProfiles.id })
    .from(analystProfiles)
    .where(eq(analystProfiles.slug, slug))
    .limit(1);
  return Boolean(row);
}

export async function createProfile(
  data: NewAnalystProfile,
): Promise<IAnalystProfile> {
  const [row] = await db.insert(analystProfiles).values(data).returning();
  return row;
}

export async function updateProfileForUser(
  userId: string,
  data: Partial<NewAnalystProfile>,
): Promise<IAnalystProfile | null> {
  const [row] = await db
    .update(analystProfiles)
    .set({ ...data, updated_at: new Date() })
    .where(eq(analystProfiles.user_id, userId))
    .returning();
  return row ?? null;
}
