import { and, eq, ilike, or, sql } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  analystApplications,
  users,
  type IAnalystApplication,
  type NewAnalystApplication,
} from "@/server/models/schema";
import { APPLICATION_STATUS } from "@/modules/analyst/analyst.constants";

export const analystApplicationSortMap = {
  status: analystApplications.status,
  created_at: analystApplications.created_at,
  reviewed_at: analystApplications.reviewed_at,
};

export function listAnalystApplications(search?: string) {
  const conditions = [];
  if (search) {
    const like = `%${search}%`;
    const searchCond = or(
      ilike(sql`concat(${users.first_name}, ' ', ${users.last_name})`, like),
      ilike(users.email, like),
    );
    if (searchCond) conditions.push(searchCond);
  }

  return db
    .select({
      id: analystApplications.id,
      user_id: analystApplications.user_id,
      pitch: analystApplications.pitch,
      experience_years: analystApplications.experience_years,
      specialties: analystApplications.specialties,
      website: analystApplications.website,
      status: analystApplications.status,
      reviewed_by: analystApplications.reviewed_by,
      reviewed_at: analystApplications.reviewed_at,
      rejection_reason: analystApplications.rejection_reason,
      created_at: analystApplications.created_at,
      updated_at: analystApplications.updated_at,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
    })
    .from(analystApplications)
    .innerJoin(users, eq(users.id, analystApplications.user_id))
    .where(conditions.length ? and(...conditions) : undefined)
    .$dynamic();
}

export async function getPendingApplicationForUser(
  userId: string,
): Promise<IAnalystApplication | null> {
  const [row] = await db
    .select()
    .from(analystApplications)
    .where(
      and(
        eq(analystApplications.user_id, userId),
        eq(analystApplications.status, APPLICATION_STATUS.PENDING),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getLatestApplicationForUser(
  userId: string,
): Promise<IAnalystApplication | null> {
  const [row] = await db
    .select()
    .from(analystApplications)
    .where(eq(analystApplications.user_id, userId))
    .orderBy(sql`${analystApplications.created_at} desc`)
    .limit(1);
  return row ?? null;
}

export async function getApplicationById(
  id: number,
): Promise<IAnalystApplication | null> {
  const [row] = await db
    .select()
    .from(analystApplications)
    .where(eq(analystApplications.id, id))
    .limit(1);
  return row ?? null;
}

export async function createApplication(
  data: NewAnalystApplication,
): Promise<IAnalystApplication> {
  const [row] = await db.insert(analystApplications).values(data).returning();
  return row;
}

export async function updateApplication(
  id: number,
  data: Partial<NewAnalystApplication>,
): Promise<IAnalystApplication | null> {
  const [row] = await db
    .update(analystApplications)
    .set({ ...data, updated_at: new Date() })
    .where(eq(analystApplications.id, id))
    .returning();
  return row ?? null;
}
