import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { verifyMyConnection } from "@/server/modules/broker/broker-connection.service";

type RouteContext = { params: Promise<{ id: string }> };

async function postHandler(req: NextRequestWithUser, { params }: RouteContext) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const { id } = await params;
  const connectionId = Number(id);
  if (!connectionId || Number.isNaN(connectionId)) {
    return sendError(400, "Invalid connection id");
  }

  const result = await verifyMyConnection(userId, connectionId);
  return sendResult(result);
}

export const POST = withUserAuth(postHandler);
