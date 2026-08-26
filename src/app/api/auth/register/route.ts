import { NextRequest } from "next/server";
import { sendResult, sendResultWithHeaders } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { registerSchema } from "@/modules/auth/register/register.validator";
import { AccountService } from "@/server/modules/auth";
import { setSessionCookie } from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";

async function handler(req: NextRequest) {
  const body = await req.json();
  const validated = validateData(registerSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await AccountService.register(req, validated.data);

  if (result.status === 1 && result.data?.token) {
    const headers = new Headers();
    setSessionCookie(headers, result.data.token, { remember: false });
    delete result.data.token;
    return sendResultWithHeaders(result, headers);
  }

  return sendResult(result);
}

export const POST = withPublic(handler);
