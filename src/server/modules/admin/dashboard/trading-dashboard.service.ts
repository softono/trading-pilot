import { eq, sql, gte } from "drizzle-orm";
import db from "@/server/lib/db";
import {
  analystApplications,
  analystProfiles,
  signals,
  signalDeliveries,
  orderExecutions,
} from "@/server/models/schema";
import { APPLICATION_STATUS } from "@/modules/analyst/analyst.constants";
import { EXECUTION_STATUS } from "@/modules/broker/broker.constants";
import type { ApiResult } from "@/types";

async function count(query: Promise<{ count: number }[]>): Promise<number> {
  const [row] = await query;
  return Number(row?.count ?? 0);
}

export async function getTradingDashboardStats(): Promise<ApiResult> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    analystsCount,
    pendingApplications,
    signalsToday,
    failedDeliveries,
    failedExecutions,
  ] = await Promise.all([
    count(db.select({ count: sql<number>`count(*)` }).from(analystProfiles)),
    count(
      db
        .select({ count: sql<number>`count(*)` })
        .from(analystApplications)
        .where(eq(analystApplications.status, APPLICATION_STATUS.PENDING)),
    ),
    count(
      db
        .select({ count: sql<number>`count(*)` })
        .from(signals)
        .where(gte(signals.created_at, startOfDay)),
    ),
    count(
      db
        .select({ count: sql<number>`count(*)` })
        .from(signalDeliveries)
        .where(eq(signalDeliveries.status, "failed")),
    ),
    count(
      db
        .select({ count: sql<number>`count(*)` })
        .from(orderExecutions)
        .where(eq(orderExecutions.status, EXECUTION_STATUS.FAILED)),
    ),
  ]);

  return {
    http_status: 200,
    status: 1,
    message: "Trading dashboard stats retrieved successfully",
    data: {
      analystsCount,
      pendingApplications,
      signalsToday,
      failedDeliveries,
      failedExecutions,
    },
  };
}
