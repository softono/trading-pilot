import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { requireAnalyst } from "@/server/utils/requireRole";
import { getAnalystDashboardStats } from "@/server/modules/analyst/analyst-dashboard.service";
import { getClientTimezone } from "@/server/lib/date";

async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const result = await getAnalystDashboardStats(userId, getClientTimezone(req));
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
