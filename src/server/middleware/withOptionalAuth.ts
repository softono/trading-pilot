import { validateSession } from "@/server/modules/auth/session.service";
import { getSessionToken } from "@/server/utils/authCookie";
import { USER_STATUS } from "@/modules/account/user.constants";
import { sendError } from "@/server/utils/response";
import { errorLog } from "@/server/lib/logger";
import { NextRequestWithUser } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteArgs = [ctx?: any, ...rest: any[]];

// Like withUserAuth, but a missing/invalid session is not an error — req.user simply stays
// undefined. For public content whose response SHAPE depends on whether the viewer is logged in
// (e.g. trade-signals detail masking fields for non-subscribers) without requiring login to view
// the page at all.
export function withOptionalAuth<A extends RouteArgs>(
  handler: (
    req: NextRequestWithUser,
    ...args: A
  ) => Promise<Response> | Response,
) {
  return async (req: NextRequestWithUser, ...args: A) => {
    try {
      const token = getSessionToken(req);
      if (token) {
        const result = await validateSession(token);
        if (result?.user && result.user.status === USER_STATUS.ACTIVE) {
          req.user = result.user;
          req.session = result.session;
        }
      }
      return await handler(req, ...args);
    } catch (error: unknown) {
      errorLog(
        `Error in ${req.method} ${req.nextUrl.pathname}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return sendError(500, "Something went wrong");
    }
  };
}
