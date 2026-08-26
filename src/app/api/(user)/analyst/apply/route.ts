import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import {
  applyForAnalyst,
  getMyApplication,
} from "@/server/modules/analyst/analyst-application.service";
import { validateData } from "@/server/lib/validator";
import { applicationSaveSchema } from "@/modules/analyst/analyst.validator";

async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const result = await getMyApplication(userId);
  return sendResult(result);
}

async function postHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = await req.json().catch(() => ({}));

  const validated = validateData(applicationSaveSchema, body);
  if (!validated.status) return sendResult(validated);

  const displayName =
    `${req.user?.first_name ?? ""} ${req.user?.last_name ?? ""}`.trim() ||
    req.user!.email;

  const result = await applyForAnalyst(
    userId,
    req.user?.role,
    displayName,
    validated.data,
  );
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const POST = withUserAuth(postHandler);
