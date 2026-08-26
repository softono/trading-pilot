import { verifyEmailChange } from "@/server/modules/account/email-change.service";
import { validateData } from "@/server/lib/validator";
import { getClientInfo } from "@/server/utils/clientInfo";
import { emailChangeVerifySchema } from "@/modules/account/email.validator";
import { sendResult, sendError } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(emailChangeVerifySchema, body);
  if (!validated.status) return sendResult(validated);

  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const clientInfo = getClientInfo(req);
  return sendResult(
    await verifyEmailChange(userId, validated.data, clientInfo),
  );
}

export const POST = withUserAuth(handler);
