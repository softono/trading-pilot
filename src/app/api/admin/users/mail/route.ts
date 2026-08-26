import { sendError, sendMessage, sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendAdminMail } from "@/server/modules/admin/user/user.service";
import { userMailSchema } from "@/server/modules/admin/user/mail.validator";

async function handler(req: NextRequestWithAdmin) {
  const body = await req.json();
  const validated = validateData(userMailSchema, body);
  if (!validated.status) return sendResult(validated);
  const data = validated.data;

  const res = await sendAdminMail({
    to_user: data.to_user,
    subject: data.subject,
    message: data.message,
  });

  if (res.status === 0) {
    return sendError(500, res.message ?? "Failed to send mail");
  }

  return sendMessage("Email sent to user");
}

export const POST = withAdminAuth(handler);
