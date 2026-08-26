import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { otpSendSchema } from "@/server/modules/auth/otp.validator";
import { AccountService } from "@/server/modules/auth";
import { rateLimit } from "@/server/lib/rateLimit";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientIp } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const rl = await rateLimit(`otp:send:${getClientIp(req)}`, 5, 300);
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const body = await req.json();
  const validated = validateData(otpSendSchema, body);
  if (!validated.status) return sendResult(validated);
  return sendResult(await AccountService.sendOtp(validated.data));
}
export const POST = withPublic(handler);
