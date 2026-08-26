import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { sendError, sendResult } from "@/server/utils/response";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { logoutDeviceById } from "@/server/modules/account/account.service";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithAdmin) {
  const body = await req.json().catch(() => ({}));
  const sessionId = body?.device_id || body?.id;
  if (!sessionId) return sendError(400, "Session id is required");

  const adminId = req.user?.id;
  if (!adminId) return sendError(401, "Unauthorized");

  const clientInfo = getClientInfo(req);
  const result = await logoutDeviceById(sessionId, clientInfo, adminId);

  return sendResult(result);
}

export const POST = withAdminAuth(handler);
