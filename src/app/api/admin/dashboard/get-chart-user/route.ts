import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { getAdminChartUser } from "@/server/modules/admin/account/dashboard.service";

async function handler(req: NextRequestWithAdmin) {
  const sp = req.nextUrl.searchParams;
  const period = sp.get("type") || sp.get("period") || undefined;
  const months = sp.get("months") ? Number(sp.get("months")) : undefined;

  const data = await getAdminChartUser({ period, months });
  return sendResponse(200, { status: 1, data });
}

export const GET = withAdminAuth(handler);
