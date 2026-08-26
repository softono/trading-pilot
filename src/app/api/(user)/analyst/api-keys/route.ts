import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { requireAnalyst } from "@/server/utils/requireRole";
import {
  listMyApiKeys,
  generateApiKey,
} from "@/server/modules/analyst/api-key.service";
import { validateData } from "@/server/lib/validator";
import { apiKeyCreateSchema } from "@/modules/analyst/analyst.validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { getClientTimezone } from "@/server/lib/date";

async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const tz = getClientTimezone(req);
  const result = await listMyApiKeys(userId, validated.data, tz);
  return sendResult(result);
}

async function postHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");
  const denied = requireAnalyst(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const validated = validateData(apiKeyCreateSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await generateApiKey(userId, validated.data);
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const POST = withUserAuth(postHandler);
