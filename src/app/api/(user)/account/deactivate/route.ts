import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { deactivate } from "@/server/modules/account/account.service";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const clientInfo = getClientInfo(req);
  const result = await deactivate(userId, clientInfo);
  return sendResult(result);
}

export const DELETE = withUserAuth(handler);
