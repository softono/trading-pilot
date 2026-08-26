import { startEmailChange } from "@/server/modules/account/email-change.service";
import { validateData } from "@/server/lib/validator";
import { rateLimit } from "@/server/lib/rateLimit";
import { getClientIp } from "@/server/utils/clientInfo";
import { emailChangeStartSchema } from "@/modules/account/email.validator";
import { sendResult, sendError } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";

async function handler(req: NextRequestWithUser) {
  const rl = await rateLimit(
    `account:email-change:${getClientIp(req)}`,
    5,
    300,
  );
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const body = await req.json();
  const validated = validateData(emailChangeStartSchema, body);
  if (!validated.status) return sendResult(validated);

  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  return sendResult(await startEmailChange(userId, validated.data));
}

export const POST = withUserAuth(handler);
