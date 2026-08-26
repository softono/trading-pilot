import { sendError, sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import {
  validateUserId,
  sessionList,
} from "@/server/modules/account/account.service";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { getClientTimezone } from "@/server/lib/date";

async function handler(
  req: NextRequestWithAdmin,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const invalid = await validateUserId(String(id));
  if (invalid) {
    return sendError(400, invalid.message ?? "Invalid user ID");
  }

  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const res = await sessionList(
    String(id),
    validated.data,
    getClientTimezone(req),
  );
  return sendResult(res);
}

export const GET = withAdminAuth(handler);
