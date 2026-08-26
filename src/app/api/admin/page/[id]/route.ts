import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResult, sendResponse } from "@/server/utils/response";
import {
  getAdminPageById,
  updateAdminPage,
} from "@/server/modules/admin/page/pages.service";
import { validateData } from "@/server/lib/validator";
import {
  pageSaveSchema,
  type PageSaveInput,
} from "@/modules/page/page.validator";
import { getClientTimezone } from "@/server/lib/date";
import { USER_STATUS } from "@/modules/account/user.constants";

type RouteContext = { params: Promise<{ id: string }> };

async function getHandler(req: NextRequestWithAdmin, { params }: RouteContext) {
  const { id } = await params;
  if (!id) return sendError(400, "Invalid page id");

  const result = await getAdminPageById(id, getClientTimezone(req));
  return sendResult(result);
}

async function patchHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;
  if (!id) return sendError(400, "Invalid page id");

  const body = await req.json().catch(() => ({}));

  // Status toggle action: PATCH { action: "activate" | "deactivate" }
  const action = body.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(400, "Invalid action");
    }

    const data: Partial<PageSaveInput> = {
      status: action === "activate" ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE,
    };

    const result = await updateAdminPage(id, data, getClientTimezone(req));
    return sendResponse(200, {
      status: 1,
      data: result?.data,
      message: `Page ${action === "activate" ? "activated" : "deactivated"} successfully`,
    });
  }

  const validated = validateData(pageSaveSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await updateAdminPage(
    id,
    validated.data,
    getClientTimezone(req),
  );
  return sendResult(result);
}

export const GET = withAdminAuth(getHandler);
export const PATCH = withAdminAuth(patchHandler);
