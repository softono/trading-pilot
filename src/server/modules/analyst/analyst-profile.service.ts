import { slugify } from "@/utils/general";
import { getFileUrl } from "@/server/lib/file";
import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";
import {
  getProfileByUserId,
  getProfileBySlug,
  slugExists,
  createProfile,
  updateProfileForUser,
  listPublicAnalystProfiles,
  listAnalystProfiles,
  analystProfileSortMap,
} from "@/server/models/analyst-profile.repository";
import { ANALYST_TYPE } from "@/modules/analyst/analyst.constants";
import type { AnalystType } from "@/modules/analyst/analyst.types";
import type { IAnalystProfile } from "@/server/models/schema";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";
import type { AnalystProfileSaveInput } from "@/modules/analyst/analyst.validator";

export async function generateUniqueSlug(displayName: string): Promise<string> {
  const base = slugify(displayName) || "analyst";
  let slug = base;
  let suffix = 1;
  while (await slugExists(slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function createProfileForUser(
  userId: string,
  displayName: string,
  analystType: AnalystType = ANALYST_TYPE.HUMAN,
): Promise<IAnalystProfile> {
  const existing = await getProfileByUserId(userId);
  if (existing) return existing;

  const slug = await generateUniqueSlug(displayName);
  return createProfile({
    user_id: userId,
    slug,
    display_name: displayName,
    analyst_type: analystType,
    is_public: true,
  });
}

function withAvatarUrl(profile: IAnalystProfile) {
  return {
    ...profile,
    avatar: profile.avatar ? getFileUrl(profile.avatar) : null,
  };
}

export async function getMyProfile(userId: string): Promise<ApiResult> {
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    return { http_status: 404, status: 0, message: "Profile not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Profile retrieved successfully",
    data: withAvatarUrl(profile),
  };
}

export async function updateMyProfile(
  userId: string,
  data: Partial<AnalystProfileSaveInput>,
): Promise<ApiResult> {
  const row = await updateProfileForUser(userId, data);
  if (!row) {
    return { http_status: 404, status: 0, message: "Profile not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Profile updated successfully",
    data: withAvatarUrl(row),
  };
}

export async function getPublicProfileBySlug(slug: string): Promise<ApiResult> {
  const profile = await getProfileBySlug(slug);
  if (!profile || !profile.is_public) {
    return { http_status: 404, status: 0, message: "Analyst not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Analyst retrieved successfully",
    data: withAvatarUrl(profile),
  };
}

export async function listAnalystsAdmin(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();
  const query = listAnalystProfiles(search || undefined);

  return Pagination.paginate(query, body, analystProfileSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      avatar: row.avatar ? getFileUrl(row.avatar) : null,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

export async function listPublicAnalysts(
  body: PaginationInput,
): Promise<ApiResult> {
  const query = listPublicAnalystProfiles();

  return Pagination.paginate(query, body, analystProfileSortMap, {
    defaultSort: { field: "display_name", direction: "asc" },
    mapRow: (row) => ({
      ...row,
      avatar: row.avatar ? getFileUrl(row.avatar) : null,
    }),
  });
}
