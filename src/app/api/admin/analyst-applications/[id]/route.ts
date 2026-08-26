import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { getApplicationDetail } from "@/server/modules/analyst/analyst-application.service";
import { getClientTimezone } from "@/server/lib/date";

type RouteContext = { params: Promise<{ id: string }> };

async function getHandler(req: NextRequestWithAdmin, { params }: RouteContext) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!applicationId || Number.isNaN(applicationId)) {
    return sendError(400, "Invalid application id");
  }

  const result = await getApplicationDetail(
    applicationId,
    getClientTimezone(req),
  );
  return sendResult(result);
}

export const GET = withAdminAuth(getHandler);
