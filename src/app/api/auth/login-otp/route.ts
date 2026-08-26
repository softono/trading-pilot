import { NextRequest } from "next/server";
import { sendResult, sendResultWithHeaders } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { loginOtpSchema } from "@/modules/auth/login/login-otp.validator";
import { AccountService } from "@/server/modules/auth";
import {
  setSessionCookie,
  setTfaChallengeCookie,
} from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";

import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const body = await req.json();
  const validated = validateData(loginOtpSchema, body);
  if (!validated.status) return sendResult(validated);

  const data = validated.data;

  if (data.step === 1) {
    return sendResult(
      await AccountService.sendOtp({ email: data.email, type: "signin" }),
    );
  }

  const clientInfo = getClientInfo(req);
  const result = await AccountService.loginWithOtp(
    req,
    {
      email: data.email,
      otp: data.otp || "",
      remember: data.remember,
    },
    clientInfo,
  );

  if (result.status === 1 && result.data?.token) {
    const headers = new Headers();
    setSessionCookie(headers, result.data.token, { remember: data.remember });
    delete result.data.token;
    return sendResultWithHeaders(result, headers);
  }

  if (result.status === 1 && result.data?.tfaHandle) {
    const headers = new Headers();
    setTfaChallengeCookie(headers, result.data.tfaHandle);
    delete result.data.tfaHandle;
    return sendResultWithHeaders(result, headers);
  }

  return sendResult(result);
}

export const POST = withPublic(handler);
