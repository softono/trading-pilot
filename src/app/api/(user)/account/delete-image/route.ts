import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { deleteImage } from "@/server/modules/account/account.service";
import { NextRequestWithUser } from "@/server/middleware/types";

async function handler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const result = await deleteImage(userId);
  return sendResult(result);
}

export const DELETE = withUserAuth(handler);
