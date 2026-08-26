import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { requireAnalyst } from "@/server/utils/requireRole";
import {
  getMySettings,
  updateMySettings,
} from "@/server/modules/analyst/user-settings.service";
import { validateData } from "@/server/lib/validator";
import { userSettingsSaveSchema } from "@/modules/analyst/analyst.validator";

async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const result = await getMySettings(userId);
  return sendResult(result);
}

async function patchHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const validated = validateData(userSettingsSaveSchema.partial(), body);
  if (!validated.status) return sendResult(validated);

  const result = await updateMySettings(userId, validated.data);
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const PATCH = withUserAuth(patchHandler);
