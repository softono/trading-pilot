import {
  sendResult,
  sendResultWithHeaders,
  sendError,
} from "@/server/utils/response";
import { PasskeyService } from "@/server/modules/auth";
import { setWebAuthnChallengeCookie } from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";

async function handler() {
  try {
    const result = await PasskeyService.loginOptions();

    if (result.status === 1 && result.data?.challengeHandle) {
      const headers = new Headers();
      setWebAuthnChallengeCookie(headers, result.data.challengeHandle);
      delete result.data.challengeHandle;
      return sendResultWithHeaders(result, headers);
    }

    return sendResult(result);
  } catch {
    return sendError(500, "An unexpected error occurred");
  }
}
export const POST = withPublic(handler);
