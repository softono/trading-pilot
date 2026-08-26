import { sendResult, sendError } from "@/server/utils/response";
import { TfaService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";

async function handler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  return sendResult(await TfaService.getStatus(userId));
}

export const GET = withUserAuth(handler);
