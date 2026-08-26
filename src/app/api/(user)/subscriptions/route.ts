import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import {
  subscribe,
  listMySubscriptionsService,
} from "@/server/modules/subscription/subscription.service";
import { validateData } from "@/server/lib/validator";
import { subscribeSchema } from "@/modules/subscription/subscription.validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { getClientTimezone } from "@/server/lib/date";

async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const tz = getClientTimezone(req);
  const result = await listMySubscriptionsService(userId, validated.data, tz);
  return sendResult(result);
}

async function postHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = await req.json().catch(() => ({}));
  const validated = validateData(subscribeSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await subscribe(userId, validated.data.analyst_id);
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const POST = withUserAuth(postHandler);
