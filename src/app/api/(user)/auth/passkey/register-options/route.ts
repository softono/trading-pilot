import { sendResult, sendResultWithHeaders } from "@/server/utils/response";
import { PasskeyService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { setWebAuthnChallengeCookie } from "@/server/utils/authCookie";
import type { NextRequestWithUser } from "@/server/middleware/types";

async function handler(req: NextRequestWithUser) {
  const result = await PasskeyService.registerOptions(req, req.user!.id);

  if (result.status === 1 && result.data?.challengeHandle) {
    const headers = new Headers();
    setWebAuthnChallengeCookie(headers, result.data.challengeHandle);
    delete result.data.challengeHandle;
    return sendResultWithHeaders(result, headers);
  }

  return sendResult(result);
}

export const POST = withUserAuth(handler);
