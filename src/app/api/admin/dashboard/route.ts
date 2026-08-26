import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { getAdminDashboardCounts } from "@/server/modules/admin/account/dashboard.service";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(_req: NextRequestWithAdmin) {
  const { total, active, inactive } = await getAdminDashboardCounts();
  return sendResponse(200, {
    data: { total, active, inactive },
    message: "Admin dashboard data retrieved",
  });
}
export const GET = withAdminAuth(handler);
