import { NextRequest } from "next/server";
import { sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { verifyAccountSchema } from "@/server/modules/auth/verify-account.validator";
import { AccountService } from "@/server/modules/auth";
import { withPublic } from "@/server/middleware/withPublic";

async function handler(req: NextRequest) {
  const body = await req.json();
  const validated = validateData(verifyAccountSchema, body);
  if (!validated.status) return sendResult(validated);
  return sendResult(await AccountService.verifyAccount(validated.data));
}

export const POST = withPublic(handler);
