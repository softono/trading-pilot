import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { AuthService } from "@/server/modules/auth";
import { getSessionToken } from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientTimezone } from "@/server/lib/date";

async function handler(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) return sendError(401, "Not authenticated");
  return sendResult(
    await AuthService.getSession(token, getClientTimezone(req)),
  );
}

export const GET = withPublic(handler);
