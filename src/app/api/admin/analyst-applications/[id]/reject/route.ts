import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { rejectApplication } from "@/server/modules/analyst/analyst-application.service";
import { validateData } from "@/server/lib/validator";
import { applicationRejectSchema } from "@/modules/analyst/analyst.validator";

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

  const body = await req.json().catch(() => ({}));
  const validated = validateData(applicationRejectSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await rejectApplication(
    applicationId,
    reviewerId,
    validated.data,
  );
  return sendResult(result);
}

export const POST = withAdminAuth(postHandler);
