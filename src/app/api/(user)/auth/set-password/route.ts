import { sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { setPasswordSchema } from "@/server/modules/auth/set-password.validator";
import { AuthService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(setPasswordSchema, body);
  if (!validated.status) return sendResult(validated);
  const clientInfo = getClientInfo(req);
  return sendResult(
    await AuthService.setPassword(
      req.user!.id,
      validated.data.password,
      clientInfo,
    ),
  );
}

export const POST = withUserAuth(handler);
