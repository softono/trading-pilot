import { eq, and } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  userLoginLinks,
  type IUserLoginLink,
  type NewUserLoginLink,
} from "@/server/models/user-login-link";

export async function insertLoginLink(
  values: NewUserLoginLink,
): Promise<IUserLoginLink> {
  const [row] = await db.insert(userLoginLinks).values(values).returning();
  return row;
}

export async function findLoginLinkById(
  id: string,
): Promise<IUserLoginLink | null> {
  const [row] = await db
    .select()
    .from(userLoginLinks)
    .where(eq(userLoginLinks.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateLoginLinkStatus(
  id: string,
  status: string,
): Promise<void> {
  await db
    .update(userLoginLinks)
    .set({ status })
    .where(eq(userLoginLinks.id, id));
}

export async function updateLoginLinkResponse(
  id: string,
  status: "approved" | "rejected",
  approvedAt: Date | null,
): Promise<void> {
  await db
    .update(userLoginLinks)
    .set({ status, approved_at: approvedAt })
    .where(
      and(eq(userLoginLinks.id, id), eq(userLoginLinks.status, "pending")),
    );
}

export async function claimApprovedLoginLink(
  id: string,
): Promise<IUserLoginLink | null> {
  const [row] = await db
    .update(userLoginLinks)
    .set({ status: "consumed" })
    .where(
      and(eq(userLoginLinks.id, id), eq(userLoginLinks.status, "approved")),
    )
    .returning();
  return row ?? null;
}
