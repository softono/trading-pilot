import { sendError, sendResult, sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { getAdminProfileById } from "@/server/modules/admin/admin/admin.service";
import {
  deleteAccount,
  activateAccount,
  deactivateAccount,
  updateProfile,
} from "@/server/modules/account/account.service";
import { validateData } from "@/server/lib/validator";
import { adminSaveSchema } from "@/server/modules/admin/admin/save.validator";
import { uploadFile, validateFile, MIME_IMAGE } from "@/server/lib/file";
import { parseBody } from "@/server/utils/parseBody";
import { getClientInfo } from "@/server/utils/clientInfo";
import { USER_ROLES } from "@/modules/account/user.constants";
import { getClientTimezone } from "@/server/lib/date";

type RouteContext = { params: Promise<{ id: string }> };

const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] as const;
const validActions = new Set(["activate", "deactivate"]);

async function getHandler(req: NextRequestWithAdmin, { params }: RouteContext) {
  const { id } = await params;
  if (!id) return sendError(400, "Invalid admin ID");

  const res = await getAdminProfileById(id, getClientTimezone(req));
  if (res.status === 0) {
    return sendError(res.http_status ?? 404, res.message ?? "Admin not found");
  }

  return sendResponse(200, { status: 1, data: res.data });
}

async function patchHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;
  if (!id) return sendError(400, "Invalid admin ID");

  const { fields, files } = await parseBody(req);

  // Status toggle action: PATCH { action: "activate" | "deactivate" }
  const action = fields.action;
  if (action) {
    if (!validActions.has(action)) return sendError(400, "Invalid action");

    const result =
      action === "activate"
        ? await activateAccount(id, {
            entityLabel: "Admin",
            roleFilter: adminRoles,
          })
        : await deactivateAccount(id, {
            entityLabel: "Admin",
            roleFilter: adminRoles,
          });

    return sendResponse(200, {
      status: 1,
      message: result.message ?? `Admin ${action}d successfully`,
      data: result.data ?? undefined,
    });
  }

  // Profile update (multipart or JSON)
  const validated = validateData(adminSaveSchema, fields);
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
    activityType: "ADMIN_UPDATE",
    entityLabel: "Admin",
  });

  return sendResult(result);
}

async function deleteHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;
  if (!id) return sendError(400, "Invalid admin ID");

  const res = await deleteAccount(id, {
    entityLabel: "Admin",
    roleFilter: adminRoles,
  });

  if (res.status === 0) {
    return sendError(500, res.message ?? "An unexpected error occurred");
  }

  return sendResponse(200, {
    status: 1,
    message: res.message ?? "Admin deleted successfully",
  });
}

export const GET = withAdminAuth(getHandler);
export const PATCH = withAdminAuth(patchHandler);
export const DELETE = withAdminAuth(deleteHandler);
