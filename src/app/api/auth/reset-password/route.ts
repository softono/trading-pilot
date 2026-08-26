import { NextRequest } from "next/server";
import { sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { resetPasswordSchema } from "@/server/modules/auth/reset-password.validator";
import { AccountService } from "@/server/modules/auth";
import { withPublic } from "@/server/middleware/withPublic";

async function handler(req: NextRequest) {
  const body = await req.json();
  const validated = validateData(resetPasswordSchema, body);
  if (!validated.status) return sendResult(validated);
  return sendResult(await AccountService.resetPassword(validated.data));
}

export const POST = withPublic(handler);
