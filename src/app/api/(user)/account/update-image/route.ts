import { updateImage } from "@/server/modules/account/account.service";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { NextRequestWithUser } from "@/server/middleware/types";
import { sendResult, sendError } from "@/server/utils/response";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithUser) {
  const userId = req.user?.id || req.session?.user_id;
  if (!userId) return sendError(401, "Unauthorized");

  const formData = await req.formData();
  const file = formData.get("image");

  const clientInfo = getClientInfo(req);
  const result = await updateImage(userId, file as Blob, clientInfo);
  return sendResult(result);
}

export const POST = withUserAuth(handler);
