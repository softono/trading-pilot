import { sendError, sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { tfaBackupCodesSchema } from "@/server/modules/auth/tfa/tfa.validator";
import { TfaService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(tfaBackupCodesSchema, body);
  if (!validated.status) return sendResult(validated);

  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const clientInfo = getClientInfo(req);
  return sendResult(
    await TfaService.regenerateBackupCodes(
      clientInfo,
      userId,
      validated.data.password,
    ),
  );
}

export const POST = withUserAuth(handler);
