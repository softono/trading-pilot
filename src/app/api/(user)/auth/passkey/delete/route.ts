import { sendResult, sendError } from "@/server/utils/response";
import { PasskeyService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const body = await req.json();
  if (!body.id) return sendError(422, "Passkey ID is required");
  const clientInfo = getClientInfo(req);
  return sendResult(
    await PasskeyService.remove(clientInfo, req.user!.id, body.id),
  );
}

export const POST = withUserAuth(handler);
