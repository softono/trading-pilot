import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { getAdminSettingsMap } from "@/server/modules/admin/setting/setting.service";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(_req: NextRequestWithAdmin) {
  const map = await getAdminSettingsMap();
  return sendResponse(200, { status: 1, data: map });
}

export const GET = withAdminAuth(handler);
