import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { TfaService } from "@/server/modules/auth";
import {
  getTfaChallengeHandle,
  getSessionToken,
} from "@/server/utils/authCookie";
import { getCache } from "@/server/lib/cache";
import { rateLimit } from "@/server/lib/rateLimit";
import { validateSession } from "@/server/modules/auth/session.service";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientIp } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const rl = await rateLimit(`"tfa:send-otp:${getClientIp(req)}`, 5, 300);
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  // Authenticated flow (enable 2FA while logged in)
  const sessionToken = getSessionToken(req);
  if (sessionToken) {
    const result = await validateSession(sessionToken);
    if (result) {
      return sendResult(await TfaService.sendTfaOtp(req, result.user.id));
    }
  }

  // Login challenge flow (2FA verification during login)
  const tfaHandle = getTfaChallengeHandle(req);
  if (!tfaHandle) return sendError(401, "No 2FA challenge found");

  const raw = await getCache(`auth:tfa:${tfaHandle}`);
  if (!raw) return sendError(401, "Challenge expired");

  const { userId } = JSON.parse(raw) as { userId: string };
  return sendResult(await TfaService.sendTfaOtp(req, userId));
}

export const POST = withPublic(handler);
