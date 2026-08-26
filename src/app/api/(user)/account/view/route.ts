import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResponse } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { toSafeUser } from "@/server/modules/account/user.service";

async function handler(req: NextRequestWithUser) {
  if (!req.user) return sendError(401, "User not authenticated");

  return sendResponse(200, {
    data: {
      user: toSafeUser(req.user),
    },
    message: "Account details retrieved",
  });
}

export const GET = withUserAuth(handler);
