import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { logoutDevice } from "@/server/modules/account/account.service";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const body = await req.json().catch(() => ({}));
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const deviceId = body.deviceId || body.device_id;
  if (!deviceId) return sendError(400, "Device ID is required");

  const clientInfo = getClientInfo(req);
  const result = await logoutDevice(userId, deviceId, clientInfo);
  return sendResult(result);
}

export const POST = withUserAuth(handler);
