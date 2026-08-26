import { NextRequest } from "next/server";
import {
  sendResult,
  sendResultWithHeaders,
  sendError,
} from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { loginLinkPollSchema } from "@/modules/auth/login-link/login-link.validator";
import * as LoginLinkService from "@/server/modules/auth/login-link.service";
import {
  setSessionCookie,
  clearTfaChallengeCookie,
} from "@/server/utils/authCookie";
import { rateLimit } from "@/server/lib/rateLimit";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientIp } from "@/server/utils/clientInfo";

import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const body = await req.json();
  const validated = validateData(loginLinkPollSchema, body);
  if (!validated.status) return sendResult(validated);

  const rl = await rateLimit(
    `login-link:poll:${validated.data.requestId}:${getClientIp(req)}`,
    900,
    300,
  );
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const clientInfo = getClientInfo(req);
  const result = await LoginLinkService.poll(req, validated.data, clientInfo);

  if (result.status === 1 && result.data?.state === "success") {
    const headers = new Headers();
    setSessionCookie(headers, result.data.token, {
      remember: !!result.data.remember,
    });
    clearTfaChallengeCookie(headers);
    delete result.data.token;
    delete result.data.remember;
    return sendResultWithHeaders(result, headers);
  }

  return sendResult(result);
}

export const POST = withPublic(handler);
