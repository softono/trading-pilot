import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import {
  getMyProfile,
  updateMyProfile,
} from "@/server/modules/analyst/analyst-profile.service";
import { validateData } from "@/server/lib/validator";
import { analystProfileSaveSchema } from "@/modules/analyst/analyst.validator";
import { requireAnalyst } from "@/server/utils/requireRole";

async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const result = await getMyProfile(userId);
  return sendResult(result);
}

async function patchHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));

  const validated = validateData(analystProfileSaveSchema.partial(), body);
  if (!validated.status) return sendResult(validated);

  const result = await updateMyProfile(userId, validated.data);
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const PATCH = withUserAuth(patchHandler);
