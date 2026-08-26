import { NextRequest } from "next/server";
import {
  sendResult,
  sendResultWithHeaders,
  sendError,
} from "@/server/utils/response";
import { PasskeyService } from "@/server/modules/auth";
import {
  getWebAuthnChallengeHandle,
  clearWebAuthnChallengeCookie,
  setSessionCookie,
} from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const challengeHandle = getWebAuthnChallengeHandle(req);
  if (!challengeHandle) return sendError(400, "No challenge found");

  const body = await req.json();
  const clientInfo = getClientInfo(req);
  const result = await PasskeyService.loginVerify(
    req,
    body.response,
    challengeHandle,
    clientInfo,
  );

  if (result.status === 1 && result.data?.token) {
    const headers = new Headers();
    setSessionCookie(headers, result.data.token, { remember: true });
    clearWebAuthnChallengeCookie(headers);
    delete result.data.token;
    return sendResultWithHeaders(result, headers);
  }

  return sendResult(result);
}
export const POST = withPublic(handler);
