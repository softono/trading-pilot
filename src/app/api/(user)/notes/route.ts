import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { notelist, createNote } from "@/server/modules/note/note.service";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { getClientTimezone } from "@/server/lib/date";
import { noteSaveSchema } from "@/modules/note/note.validator";

async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = parsePaginationQuery(req.nextUrl.searchParams);

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const tz = getClientTimezone(req);
  const result = await notelist(userId, validated.data, tz);
  return sendResult(result);
}

async function postHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = await req.json().catch(() => ({}));

  const validated = validateData(noteSaveSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await createNote(userId, validated.data);
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const POST = withUserAuth(postHandler);
