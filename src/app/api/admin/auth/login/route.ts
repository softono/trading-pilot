import { NextRequest } from "next/server";
import { sendResult, sendResultWithHeaders } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { adminLoginSchema } from "@/server/modules/auth/login.validator";
import { AuthService } from "@/server/modules/auth";
import {
  setSessionCookie,
  setTfaChallengeCookie,
} from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const body = await req.json();
  const validated = validateData(adminLoginSchema, body);
  if (!validated.status) return sendResult(validated);

  const clientInfo = getClientInfo(req);
  const result = await AuthService.adminLogin(req, validated.data, clientInfo);

  if (result.status === 1 && result.data?.token) {
    const headers = new Headers();
    setSessionCookie(headers, result.data.token, {
      remember: validated.data.remember,
    });
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
