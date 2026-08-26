import { sendResultWithHeaders, sendError } from "@/server/utils/response";
import { PasskeyService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import {
  getWebAuthnChallengeHandle,
  clearWebAuthnChallengeCookie,
} from "@/server/utils/authCookie";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const challengeHandle = getWebAuthnChallengeHandle(req);
  if (!challengeHandle) return sendError(400, "No challenge found");

  const body = await req.json();
  const clientInfo = getClientInfo(req);
  const result = await PasskeyService.registerVerify(
    req,
    req.user!.id,
    body.response,
    challengeHandle,
    clientInfo,
    body.name,
  );

  const headers = new Headers();
  clearWebAuthnChallengeCookie(headers);
  return sendResultWithHeaders(result, headers);
}

export const POST = withUserAuth(handler);
