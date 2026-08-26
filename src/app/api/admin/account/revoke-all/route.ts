import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { sendError, sendResult } from "@/server/utils/response";
import { logoutAllSessions } from "@/server/modules/account/account.service";
import type { NextRequestWithAdmin } from "@/server/middleware/types";

async function handler(req: NextRequestWithAdmin) {
  const adminId = req.user?.id;
  if (!adminId) return sendError(401, "Unauthorized");

  const currentToken = req.session?.token;
  const result = await logoutAllSessions(adminId, currentToken || undefined);

  return sendResult(result);
}

export const POST = withAdminAuth(handler);
