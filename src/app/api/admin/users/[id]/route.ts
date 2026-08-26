import { sendError, sendResult, sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { getUserById } from "@/server/modules/admin/user/user.service";
import {
  validateUserId,
  deleteAccount,
  activateAccount,
  deactivateAccount,
  updateProfile,
} from "@/server/modules/account/account.service";
import { validateData } from "@/server/lib/validator";
import { userSaveSchema } from "@/modules/account/user.validator";
import { uploadFile, validateFile, MIME_IMAGE } from "@/server/lib/file";
import { parseBody } from "@/server/utils/parseBody";
import { getClientInfo } from "@/server/utils/clientInfo";
import { getClientTimezone } from "@/server/lib/date";
import { USER_ROLES } from "@/modules/account/user.constants";

type RouteContext = { params: Promise<{ id: string }> };

const userRoles = [USER_ROLES.USER] as const;

const validActions = new Set(["activate", "deactivate"]);

async function getHandler(req: NextRequestWithAdmin, { params }: RouteContext) {
  const { id } = await params;

  const invalid = await validateUserId(id);
  if (invalid) {
    return sendError(400, invalid.message ?? "Invalid user ID");
  }

  const res = await getUserById(id, getClientTimezone(req));
  if (res.status === 0) {
    return sendError(404, res.message ?? "User not found");
  }

  return sendResponse(200, { status: 1, data: res.data });
}

async function patchHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;
  if (!id) return sendError(400, "Invalid user ID");

  const { fields, files } = await parseBody(req);

  // Status toggle action: PATCH { action: "activate" | "deactivate" }
  const action = fields.action;
  if (action) {
    if (!validActions.has(action)) return sendError(400, "Invalid action");

    const result =
      action === "activate"
        ? await activateAccount(id, {
            entityLabel: "User",
            roleFilter: userRoles,
          })
        : await deactivateAccount(id, {
            entityLabel: "User",
            roleFilter: userRoles,
          });

    return sendResponse(200, {
      status: 1,
      message: result.message ?? `User ${action}d successfully`,
      data: result.data,
    });
  }

  // Profile update (multipart or JSON)
  const validated = validateData(userSaveSchema, fields);
  if (!validated.status) return sendResult(validated);
  const data = validated.data;

  if (files?.image) {
    const validation = await validateFile(files.image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(files.image, "profile");
  }

  const clientInfo = getClientInfo(req);
  const result = await updateProfile(id, data, clientInfo, {
    activityType: "USER_UPDATE",
    entityLabel: "User",
  });

  return sendResult(result);
}

async function deleteHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;
  if (!id) return sendError(400, "Invalid user ID");

  const result = await deleteAccount(id, {
    entityLabel: "User",
    roleFilter: userRoles,
  });

  if (result.status === 0) {
    return sendError(
      result.http_status ?? 400,
      result.message ?? "Failed to delete user",
    );
  }

  return sendResponse(200, {
    status: 1,
    message: result.message ?? "User deleted successfully",
  });
}

export const GET = withAdminAuth(getHandler);
export const PATCH = withAdminAuth(patchHandler);
export const DELETE = withAdminAuth(deleteHandler);
