import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResponse } from "@/server/utils/response";
import { toSafeUser } from "@/server/modules/account/user.service";

async function handler(req: NextRequestWithAdmin) {
  const user = req.user;
  if (!user) return sendError(403, "Admin access required");

  return sendResponse(200, {
    status: 1,
    message: "",
    data: toSafeUser(user),
  });
}

export const GET = withAdminAuth(handler);
