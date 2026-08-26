import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { saveAdminSettings } from "@/server/modules/admin/setting/setting.service";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithAdmin) {
  const body = await req.json();
  const clientInfo = getClientInfo(req);
  await saveAdminSettings(body, String(req.user?.id ?? ""), clientInfo);

  return sendResponse(200, {
    status: 1,
    message: "Settings saved successfully",
  });
}

export const POST = withAdminAuth(handler);
