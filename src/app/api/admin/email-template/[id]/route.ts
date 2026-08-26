import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import {
  getEmailTemplateById,
  updateEmailTemplate,
} from "@/server/modules/admin/email-template/email-template.service";
import { validateData } from "@/server/lib/validator";
import { emailTemplateSaveSchema } from "@/modules/admin/email-template/email-template.validator";
import { getClientTimezone } from "@/server/lib/date";

type RouteContext = { params: Promise<{ id: string }> };

async function getHandler(req: NextRequestWithAdmin, { params }: RouteContext) {
  const { id } = await params;
  if (!id) return sendError(400, "Template ID is required");

  const result = await getEmailTemplateById(id, getClientTimezone(req));
  return sendResult(result);
}

async function patchHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;
  if (!id) return sendError(400, "Template ID is required");

  const body = await req.json().catch(() => ({}));

  const validated = validateData(emailTemplateSaveSchema.partial(), body);
  if (!validated.status) return sendResult(validated);

  const result = await updateEmailTemplate(
    id,
    validated.data,
    getClientTimezone(req),
  );
  return sendResult(result);
}

export const GET = withAdminAuth(getHandler);
export const PATCH = withAdminAuth(patchHandler);
