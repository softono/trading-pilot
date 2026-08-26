import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError } from "@/server/utils/response";
import { USER_ROLES } from "@/modules/account/user.constants";

export function requireAnalyst(req: NextRequestWithUser) {
  if (req.user?.role !== USER_ROLES.ANALYST) {
    return sendError(403, "Analyst access required");
  }
  return null;
}
