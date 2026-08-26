import { validateSession } from "@/server/modules/auth/session.service";
import { getSessionToken } from "@/server/utils/authCookie";
import { ADMIN_ROLES } from "@/modules/account/user.constants";
import { sendError } from "@/server/utils/response";
import { USER_STATUS } from "@/modules/account/user.constants";
import { hasPermission } from "@/server/modules/account/permission";
import { errorLog } from "@/server/lib/logger";
import { NextRequestWithAdmin } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteArgs = [ctx?: any, ...rest: any[]];

export function withAdminAuth<A extends RouteArgs>(
  handler: (
    req: NextRequestWithAdmin,
    ...args: A
  ) => Promise<Response> | Response,
) {
  return async (req: NextRequestWithAdmin, ...args: A) => {
    try {
      const token = getSessionToken(req);
      if (!token) {
        return sendError(401, "Authentication required");
      }

      const result = await validateSession(token);
      if (!result) {
        return sendError(401, "Authentication required");
      }

      const { user, session } = result;
      if (!user || user.status !== USER_STATUS.ACTIVE) {
        return sendError(403, "Admin access required");
      }

      const isAdmin = (ADMIN_ROLES as readonly string[]).includes(
        user.role as string,
      );
      if (!isAdmin) {
        return sendError(403, "Admin access required");
      }

      if (!hasPermission(user, req.method, req.nextUrl.pathname)) {
        return sendError(403, "Insufficient permissions");
      }

      req.user = user;
      req.session = session;

      return await handler(req, ...args);
    } catch (error: unknown) {
      errorLog(
        `Error in ${req.method} ${req.nextUrl.pathname}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return sendError(500, "Something went wrong");
    }
  };
}
