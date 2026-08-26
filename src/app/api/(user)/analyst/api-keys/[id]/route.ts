import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { requireAnalyst } from "@/server/utils/requireRole";
import { revokeApiKey } from "@/server/modules/analyst/api-key.service";

type RouteContext = { params: Promise<{ id: string }> };

async function deleteHandler(
  req: NextRequestWithUser,
  { params }: RouteContext,
) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const { id } = await params;
  const keyId = Number(id);
  if (!keyId || Number.isNaN(keyId)) return sendError(400, "Invalid key id");

  const result = await revokeApiKey(keyId, userId);
  return sendResult(result);
}

export const DELETE = withUserAuth(deleteHandler);
