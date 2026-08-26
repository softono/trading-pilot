import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { updateEmailTemplate } from "@/server/modules/admin/email-template/email-template.service";
import { getClientTimezone } from "@/server/lib/date";

async function handler(
  req: NextRequestWithAdmin,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return sendError(400, "Template ID is required");

  const formData = await req.formData();
  const file = formData.get("file") as Blob | null;
  if (!file) return sendError(400, "No file provided");
  if (file.size > 256 * 1024) {
    return sendError(400, "File exceeds the 256KB limit");
  }

  const text = await file.text();
  const result = await updateEmailTemplate(
    id,
    { body: text },
    getClientTimezone(req),
  );
  return sendResult(result);
}
export const POST = withAdminAuth(handler);
