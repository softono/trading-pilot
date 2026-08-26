import { NextRequest } from "next/server";
import {
  sendResult,
  sendResultWithHeaders,
  sendError,
} from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { tfaVerifyLoginSchema } from "@/server/modules/auth/tfa/tfa.validator";
import { TfaService } from "@/server/modules/auth";
import {
  getTfaChallengeHandle,
  clearTfaChallengeCookie,
  setSessionCookie,
} from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  try {
    const tfaHandle = getTfaChallengeHandle(req);
    if (!tfaHandle) {
      return sendError(401, "No 2FA challenge found");
    }

    const body = await req.json();
    const validated = validateData(tfaVerifyLoginSchema, body);
    if (!validated.status) return sendResult(validated);

    const { code, method, trust_device } = validated.data;

    const clientInfo = getClientInfo(req);
    const result =
      method === "totp"
        ? await TfaService.verifyTotpLogin(
            req,
            tfaHandle,
            code,
            clientInfo,
            trust_device,
          )
        : method === "otp"
          ? await TfaService.verifyOtpLogin(
              req,
              tfaHandle,
              code,
              clientInfo,
              trust_device,
            )
          : await TfaService.verifyBackupLogin(
              req,
              tfaHandle,
              code,
              clientInfo,
              trust_device,
            );

    if (result.status === 1 && result.data?.token) {
      const headers = new Headers();
      setSessionCookie(headers, result.data.token, { remember: true });
      clearTfaChallengeCookie(headers);
      delete result.data.token;
      return sendResultWithHeaders(result, headers);
    }

    return sendResult(result);
  } catch {
    return sendError(500, "An unexpected error occurred");
  }
}

export const POST = withPublic(handler);
