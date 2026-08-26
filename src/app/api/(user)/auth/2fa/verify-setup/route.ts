import { sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { tfaVerifySetupSchema } from "@/server/modules/auth/tfa/tfa.validator";
import { TfaService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(tfaVerifySetupSchema, body);
  if (!validated.status) return sendResult(validated);
  const clientInfo = getClientInfo(req);
  return sendResult(
    await TfaService.verifySetup(
      req.user!.id,
      validated.data.code,
      clientInfo,
      validated.data.method,
    ),
  );
}

export const POST = withUserAuth(handler);
