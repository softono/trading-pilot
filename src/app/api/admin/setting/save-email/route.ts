import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { saveAdminEmailSettings } from "@/server/modules/admin/setting/setting.service";

async function handler(req: NextRequestWithAdmin) {
  const body = await req.json();
  await saveAdminEmailSettings(body);
  return sendResponse(200, {
    status: 1,
    message: "Email settings saved successfully",
  });
}

export const POST = withAdminAuth(handler);
