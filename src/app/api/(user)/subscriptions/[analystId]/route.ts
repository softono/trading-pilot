import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { unsubscribe } from "@/server/modules/subscription/subscription.service";

type RouteContext = { params: Promise<{ analystId: string }> };

async function deleteHandler(
  req: NextRequestWithUser,
  { params }: RouteContext,
) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const { analystId } = await params;
  if (!analystId) return sendError(400, "Invalid analyst id");

  const result = await unsubscribe(userId, analystId);
  return sendResult(result);
}

export const DELETE = withUserAuth(deleteHandler);
