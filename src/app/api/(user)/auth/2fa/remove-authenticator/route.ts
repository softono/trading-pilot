import { sendResult, sendError } from "@/server/utils/response";
import { TfaService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const clientInfo = getClientInfo(req);
  return sendResult(await TfaService.removeAuthenticator(userId, clientInfo));
}

export const POST = withUserAuth(handler);
