import { updateProfile } from "@/server/modules/account/account.service";
import { validateData } from "@/server/lib/validator";
import { getClientInfo } from "@/server/utils/clientInfo";
import { accountUpdateSchema } from "@/modules/account/update.validator";
import { sendResult, sendError } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(accountUpdateSchema, body);
  if (!validated.status) return sendResult(validated);

  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const clientInfo = getClientInfo(req);
  const result = await updateProfile(userId, validated.data, clientInfo);
  return sendResult(result);
}

export const PUT = withUserAuth(handler);
