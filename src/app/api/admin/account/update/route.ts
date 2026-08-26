import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { sendError, sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { updateProfile } from "@/server/modules/account/account.service";
import type { NextRequestWithAdmin } from "@/server/middleware/types";
import { adminAccountUpdateSchema } from "@/modules/admin/account/update.validator";
import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequestWithAdmin) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = await req.json();
  const validated = validateData(adminAccountUpdateSchema, body);
  if (!validated.status) return sendResult(validated);

  const clientInfo = getClientInfo(req);

  const result = await updateProfile(userId, validated.data, clientInfo, {
    activityType: "ADMIN_UPDATE",
    entityLabel: "Admin",
  });
  return sendResult(result);
}

export const PUT = withAdminAuth(handler);
