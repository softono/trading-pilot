import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { saveAdminLogoSetting } from "@/server/modules/admin/setting/setting.service";

async function handler(req: NextRequestWithAdmin) {
  const result = await saveAdminLogoSetting(req);
  return sendResponse(200, result);
}

export const POST = withAdminAuth(handler);
