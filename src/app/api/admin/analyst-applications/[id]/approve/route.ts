import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { approveApplication } from "@/server/modules/analyst/analyst-application.service";

type RouteContext = { params: Promise<{ id: string }> };

async function postHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const reviewerId = req.user?.id;
  if (!reviewerId) return sendError(401, "Unauthorized");

  const { id } = await params;
  const applicationId = Number(id);
  if (!applicationId || Number.isNaN(applicationId)) {
    return sendError(400, "Invalid application id");
  }

  const result = await approveApplication(applicationId, reviewerId);
  return sendResult(result);
}

export const POST = withAdminAuth(postHandler);
