import { sendError, sendResult } from "@/server/utils/response";
import { withOptionalAuth } from "@/server/middleware/withOptionalAuth";
import { NextRequestWithUser } from "@/server/middleware/types";
import { getPublicSignalDetailService } from "@/server/modules/signal/public-signal.service";
import { getClientTimezone } from "@/server/lib/date";

type RouteContext = { params: Promise<{ id: string }> };

async function getHandler(req: NextRequestWithUser, { params }: RouteContext) {
  const { id } = await params;
  const signalId = Number(id);
  if (!signalId || Number.isNaN(signalId)) {
    return sendError(400, "Invalid signal id");
  }

  const result = await getPublicSignalDetailService(
    signalId,
    req.user?.id,
    getClientTimezone(req),
  );
  return sendResult(result);
}

export const GET = withOptionalAuth(getHandler);
