import { NextRequest } from "next/server";
import { sendResultWithHeaders, sendError } from "@/server/utils/response";
import { AuthService } from "@/server/modules/auth";
import { getSessionToken, clearSessionCookie } from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";

async function handler(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) return sendError(401, "Not authenticated");

  const result = await AuthService.logout(token);
  const headers = new Headers();
  clearSessionCookie(headers);
  return sendResultWithHeaders(result, headers);
}

export const POST = withPublic(handler);
