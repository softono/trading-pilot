import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { sendError, sendResult } from "@/server/utils/response";
import { deleteImage } from "@/server/modules/account/account.service";
import type { NextRequestWithAdmin } from "@/server/middleware/types";

async function handler(req: NextRequestWithAdmin) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const result = await deleteImage(userId);
  return sendResult(result);
}

export const DELETE = withAdminAuth(handler);
