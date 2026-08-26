import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { sendError, sendResult } from "@/server/utils/response";
import { updateImage } from "@/server/modules/account/account.service";
import { getClientInfo } from "@/server/utils/clientInfo";
import type { NextRequestWithAdmin } from "@/server/middleware/types";

async function handler(req: NextRequestWithAdmin) {
  const adminId = req.user?.id;
  if (!adminId) {
    return sendError(401, "Unauthorized");
  }

  const formData = await req.formData();
  const file = formData.get("image");

  const clientInfo = getClientInfo(req);
  const result = await updateImage(adminId, file as Blob, clientInfo);
  return sendResult(result);
}

export const POST = withAdminAuth(handler);
