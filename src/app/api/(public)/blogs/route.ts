import { NextRequest } from "next/server";
import { sendResult } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { list } from "@/server/modules/blog/blog.service";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientTimezone } from "@/server/lib/date";
import { parsePaginationQuery } from "@/server/lib/pagination";

const handler = async (req: NextRequest) => {
  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const tz = getClientTimezone(req);
  const result = await list(validated.data, tz);
  return sendResult(result);
};
export const GET = withPublic(handler);
