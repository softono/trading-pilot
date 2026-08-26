import { sendError } from "@/server/utils/response";
import { errorLog } from "@/server/lib/logger";
import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteArgs = [ctx?: any, ...rest: any[]];

export function withPublic<A extends RouteArgs>(
  handler: (req: NextRequest, ...args: A) => Promise<Response> | Response,
) {
  return async (req: NextRequest, ...args: A) => {
    try {
      return await handler(req, ...args);
    } catch (error: unknown) {
      errorLog(
        `Error in ${req.method} ${req.nextUrl.pathname}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return sendError(500, "Something went wrong");
    }
  };
}
