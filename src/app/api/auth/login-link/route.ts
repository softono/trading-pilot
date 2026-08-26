import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { loginLinkCreateSchema } from "@/modules/auth/login-link/login-link.validator";
import * as LoginLinkService from "@/server/modules/auth/login-link.service";
import { rateLimit } from "@/server/lib/rateLimit";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientIp } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const rl = await rateLimit(`login-link:create:${getClientIp(req)}`, 5, 300);
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const body = await req.json();
  const validated = validateData(loginLinkCreateSchema, body);
  if (!validated.status) return sendResult(validated);

  return sendResult(await LoginLinkService.createSignin(req, validated.data));
}

export const POST = withPublic(handler);
