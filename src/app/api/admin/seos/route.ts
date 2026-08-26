import { sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import {
  listSeoMetas,
  createAdminSeoMeta,
} from "@/server/modules/admin/seo/seo.service";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { seoMetaSaveSchema } from "@/modules/admin/seos/seo.validator";
import { getClientTimezone } from "@/server/lib/date";

async function getHandler(req: NextRequestWithAdmin) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const res = await listSeoMetas(validated.data, getClientTimezone(req));
  return sendResult(res);
}

async function postHandler(req: NextRequestWithAdmin) {
  const body = await req.json().catch(() => ({}));

  const validated = validateData(seoMetaSaveSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await createAdminSeoMeta(validated.data);
  return sendResult(result);
}

export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler);
