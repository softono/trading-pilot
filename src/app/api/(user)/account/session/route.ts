import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { sessionList } from "@/server/modules/account/account.service";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { getDeviceUid } from "@/server/utils/authCookie";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { getClientTimezone } from "@/server/lib/date";

async function handler(req: NextRequestWithUser) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const deviceUid = getDeviceUid(req);
  const result = await sessionList(
    userId,
    validated.data,
    getClientTimezone(req),
    deviceUid,
  );
  return sendResult(result);
}

export const GET = withUserAuth(handler);
