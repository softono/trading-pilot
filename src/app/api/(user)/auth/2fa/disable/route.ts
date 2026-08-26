import { sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { tfaDisableSchema } from "@/server/modules/auth/tfa/tfa.validator";
import { TfaService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(tfaDisableSchema, body);
  if (!validated.status) return sendResult(validated);

  const clientInfo = getClientInfo(req);
  return sendResult(
    await TfaService.disable(req.user!.id, validated.data.password, clientInfo),
  );
}

export const POST = withUserAuth(handler);
