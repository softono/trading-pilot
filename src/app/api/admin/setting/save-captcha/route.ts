import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { saveAdminCaptchaSettings } from "@/server/modules/admin/setting/setting.service";

async function handler(req: NextRequestWithAdmin) {
  const body = (await req.json()) as Record<string, string>;
  await saveAdminCaptchaSettings(body);
  return sendResponse(200, {
    status: 1,
    message: "CAPTCHA settings saved successfully",
  });
}

export const POST = withAdminAuth(handler);
