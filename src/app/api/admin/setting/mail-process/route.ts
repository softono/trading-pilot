import { sendError, sendMessage, sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendMail } from "@/server/lib/mailer";
import { mailProcessSchema } from "@/server/modules/admin/setting/mail-process.validator";

async function handler(req: NextRequestWithAdmin) {
  const body = await req.json();
  const validated = validateData(mailProcessSchema, body);
  if (!validated.status) return sendResult(validated);
  const data = validated.data;

  const result = await sendMail(
    data.email!,
    "Next App",
    "<p>This is a test email to verify your SMTP configuration is working correctly.</p>",
  );

  if (result.status !== 1) {
    return sendError(500, result.message || "Failed to send test email");
  }

  return sendMessage("Test email sent successfully");
}

export const POST = withAdminAuth(handler);
