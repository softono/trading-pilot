import { sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { tfaEnableSchema } from "@/server/modules/auth/tfa/tfa.validator";
import { TfaService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(tfaEnableSchema, body);
  if (!validated.status) return sendResult(validated);

  return sendResult(
    await TfaService.enable(req, req.user!.id, validated.data.password),
  );
}

export const POST = withUserAuth(handler);
