import { eq } from "drizzle-orm";
import { sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import db from "@/server/lib/db";
import { userAccounts } from "@/server/models/schema";

async function handler(req: NextRequestWithUser) {
  const rows = await db
    .select({ providerId: userAccounts.provider_id })
    .from(userAccounts)
    .where(eq(userAccounts.user_id, req.user!.id));

  return sendResult({
    http_status: 200,
    status: 1,
    message: "OK",
    data: rows,
  });
}

export const GET = withUserAuth(handler);
