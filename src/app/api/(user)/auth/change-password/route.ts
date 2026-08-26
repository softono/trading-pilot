import { sendResult, sendResultWithHeaders } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { changePasswordSchema } from "@/server/modules/auth/change-password.validator";
import { AuthService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { clearSessionCookie } from "@/server/utils/authCookie";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  const validated = validateData(changePasswordSchema, body);
  if (!validated.status) return sendResult(validated);

  const clientInfo = getClientInfo(req);
  const result = await AuthService.changePassword(
    req.user!.id,
    validated.data.current_password,
    validated.data.new_password,
    clientInfo,
  );

  // The change revokes all sessions including this one — clear the cookie so
  // the client is sent back to login instead of holding a dead session.
  if (result.status === 1) {
    const headers = new Headers();
    clearSessionCookie(headers);
    return sendResultWithHeaders(result, headers);
  }

  return sendResult(result);
}

export const POST = withUserAuth(handler);
