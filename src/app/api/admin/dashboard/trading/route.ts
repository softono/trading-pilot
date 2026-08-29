import { sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { getTradingDashboardStats } from "@/server/modules/admin/dashboard/trading-dashboard.service";

async function handler() {
  const result = await getTradingDashboardStats();
  return sendResult(result);
}

export const GET = withAdminAuth(handler);
