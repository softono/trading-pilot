import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { sendError, sendResult } from "@/server/utils/response";
import { activityList } from "@/server/modules/account/account.service";
import type { NextRequestWithAdmin } from "@/server/middleware/types";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { getClientTimezone } from "@/server/lib/date";

async function handler(req: NextRequestWithAdmin) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await activityList(
    userId,
    validated.data,
    getClientTimezone(req),
  );
  return sendResult(result);
}

export const GET = withAdminAuth(handler);
