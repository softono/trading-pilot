import { validateSession } from "@/server/modules/auth/session.service";
import { getSessionToken } from "@/server/utils/authCookie";
import { sendError } from "@/server/utils/response";
import { USER_STATUS } from "@/modules/account/user.constants";
import { NextRequestWithUser } from "./types";
import { errorLog } from "@/server/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteArgs = [ctx?: any, ...rest: any[]];

export function withUserAuth<A extends RouteArgs>(
  handler: (
    req: NextRequestWithUser,
    ...args: A
  ) => Promise<Response> | Response,
) {
  return async (req: NextRequestWithUser, ...args: A) => {
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
        return sendError(401, "User not found or inactive");
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
