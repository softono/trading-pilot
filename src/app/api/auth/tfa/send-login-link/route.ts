import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { tfaSendLoginLinkSchema } from "@/server/modules/auth/tfa/tfa.validator";
import * as LoginLinkService from "@/server/modules/auth/login-link.service";
import { getTfaChallengeHandle } from "@/server/utils/authCookie";
import { rateLimit } from "@/server/lib/rateLimit";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientIp } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const rl = await rateLimit(`tfa:send-login-link:${getClientIp(req)}`, 5, 300);
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const tfaHandle = getTfaChallengeHandle(req);
  if (!tfaHandle) return sendError(401, "No 2FA challenge found");

  const body = await req.json().catch(() => ({}));
  const validated = validateData(tfaSendLoginLinkSchema, body);
  if (!validated.status) return sendResult(validated);

  return sendResult(
    await LoginLinkService.createTfa(
      req,
      tfaHandle,
      validated.data.trust_device,
    ),
  );
}

export const POST = withPublic(handler);
