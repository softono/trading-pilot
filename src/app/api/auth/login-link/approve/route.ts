import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { loginLinkApproveSchema } from "@/modules/auth/login-link/login-link.validator";
import * as LoginLinkService from "@/server/modules/auth/login-link.service";
import { rateLimit } from "@/server/lib/rateLimit";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientIp } from "@/server/utils/clientInfo";

async function getHandler(req: NextRequest) {
  const rl = await rateLimit(`login-link:approve:${getClientIp(req)}`, 20, 300);
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const id = req.nextUrl.searchParams.get("id") || "";
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!id || !token) return sendError(400, "Invalid link");

  return sendResult(await LoginLinkService.getApprovalInfo(id, token));
}

async function postHandler(req: NextRequest) {
  const rl = await rateLimit(`login-link:approve:${getClientIp(req)}`, 20, 300);
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const body = await req.json();
  const validated = validateData(loginLinkApproveSchema, body);
  if (!validated.status) return sendResult(validated);

  const { requestId, token, action } = validated.data;
  return sendResult(await LoginLinkService.respond(requestId, token, action));
}

export const GET = withPublic(getHandler);
export const POST = withPublic(postHandler);
