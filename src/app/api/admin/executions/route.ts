import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { listExecutionsAdminService } from "@/server/modules/broker/order-execution.service";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { getClientTimezone } from "@/server/lib/date";

async function getHandler(req: NextRequestWithAdmin) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const tz = getClientTimezone(req);
  const result = await listExecutionsAdminService(validated.data, tz);
  return sendResult(result);
}

export const GET = withAdminAuth(getHandler);
