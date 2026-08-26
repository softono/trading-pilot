import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";
import { invalidateUserCache } from "@/server/lib/auth";
import { infoLog } from "@/server/lib/logger";
import {
  listAnalystApplications,
  getPendingApplicationForUser,
  getLatestApplicationForUser,
  getApplicationById,
  createApplication,
  updateApplication,
  analystApplicationSortMap,
} from "@/server/models/analyst-application.repository";
import { updateUser } from "@/server/models/user.repository";
import { getUserById } from "@/server/modules/account/user.service";
import { createProfileForUser } from "@/server/modules/analyst/analyst-profile.service";
import {
  APPLICATION_STATUS,
  ANALYST_TYPE,
} from "@/modules/analyst/analyst.constants";
import { USER_ROLES } from "@/modules/account/user.constants";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";
import type {
  ApplicationSaveInput,
  ApplicationRejectInput,
} from "@/modules/analyst/analyst.validator";

export async function applyForAnalyst(
  userId: string,
  userRole: string | null | undefined,
  displayName: string,
  data: ApplicationSaveInput,
): Promise<ApiResult> {
  if (userRole === USER_ROLES.ANALYST) {
    return {
      http_status: 409,
      status: 0,
      message: "You are already an analyst",
    };
  }

  const pending = await getPendingApplicationForUser(userId);
  if (pending) {
    return {
      http_status: 409,
      status: 0,
      message: "You already have a pending application",
    };
  }

  const row = await createApplication({
    user_id: userId,
    pitch: data.pitch,
    experience_years: data.experience_years,
    specialties: data.specialties ?? [],
    website: data.website || null,
  });

  infoLog("analyst application submitted", { userId, applicationId: row.id });

  return {
    http_status: 201,
    status: 1,
    message: "Application submitted successfully",
    data: row,
  };
}

export async function getMyApplication(userId: string): Promise<ApiResult> {
  const row = await getLatestApplicationForUser(userId);
  if (!row) {
    return { http_status: 404, status: 0, message: "No application found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Application retrieved successfully",
    data: row,
  };
}

export async function listApplications(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();
  const query = listAnalystApplications(search || undefined);

  return Pagination.paginate(query, body, analystApplicationSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
      updated_at: dateTimeFormat(row.updated_at as Date, tz),
      reviewed_at: row.reviewed_at
        ? dateTimeFormat(row.reviewed_at as Date, tz)
        : null,
    }),
  });
}

export async function getApplicationDetail(
  id: number,
  tz: string,
): Promise<ApiResult> {
  const row = await getApplicationById(id);
  if (!row) {
    return { http_status: 404, status: 0, message: "Application not found" };
  }
  return {
    http_status: 200,
    status: 1,
    message: "Application retrieved successfully",
    data: {
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
      updated_at: dateTimeFormat(row.updated_at as Date, tz),
      reviewed_at: row.reviewed_at
        ? dateTimeFormat(row.reviewed_at as Date, tz)
        : null,
    },
  };
}

export async function approveApplication(
  id: number,
  reviewerId: string,
): Promise<ApiResult> {
  const application = await getApplicationById(id);
  if (!application) {
    return { http_status: 404, status: 0, message: "Application not found" };
  }
  if (application.status !== APPLICATION_STATUS.PENDING) {
    return {
      http_status: 409,
      status: 0,
      message: "Application already reviewed",
    };
  }

  const applicant = await getUserById(application.user_id);
  const displayName =
    `${applicant?.first_name ?? ""} ${applicant?.last_name ?? ""}`.trim() ||
    applicant?.email ||
    "Analyst";

  await updateApplication(id, {
    status: APPLICATION_STATUS.APPROVED,
    reviewed_by: reviewerId,
    reviewed_at: new Date(),
  });

  await updateUser(application.user_id, { role: USER_ROLES.ANALYST });
  await createProfileForUser(
    application.user_id,
    displayName,
    ANALYST_TYPE.HUMAN,
  );
  await invalidateUserCache(application.user_id);

  infoLog("analyst application approved", {
    applicationId: id,
    userId: application.user_id,
    reviewerId,
  });

  return {
    http_status: 200,
    status: 1,
    message: "Application approved successfully",
  };
}

export async function rejectApplication(
  id: number,
  reviewerId: string,
  data: ApplicationRejectInput,
): Promise<ApiResult> {
  const application = await getApplicationById(id);
  if (!application) {
    return { http_status: 404, status: 0, message: "Application not found" };
  }
  if (application.status !== APPLICATION_STATUS.PENDING) {
    return {
      http_status: 409,
      status: 0,
      message: "Application already reviewed",
    };
  }

  await updateApplication(id, {
    status: APPLICATION_STATUS.REJECTED,
    reviewed_by: reviewerId,
    reviewed_at: new Date(),
    rejection_reason: data.rejection_reason,
  });

  infoLog("analyst application rejected", {
    applicationId: id,
    userId: application.user_id,
    reviewerId,
  });

  return {
    http_status: 200,
    status: 1,
    message: "Application rejected successfully",
  };
}
