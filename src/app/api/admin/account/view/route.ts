import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResponse } from "@/server/utils/response";
import { toSafeUser } from "@/server/modules/account/user.service";

async function handler(req: NextRequestWithAdmin) {
  if (!req.user) return sendError(403, "Admin access required");

  return sendResponse(200, {
    status: 1,
    message: "Admin info fetched successfully",
    data: toSafeUser(req.user),
  });
}

export const GET = withAdminAuth(handler);
