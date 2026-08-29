import { NextRequest } from "next/server";
import { sendResult } from "@/server/utils/response";
import { withPublic } from "@/server/middleware/withPublic";
import { listPublicAnalysts } from "@/server/modules/analyst/analyst-profile.service";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";

async function handler(req: NextRequest) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await listPublicAnalysts(validated.data);
  return sendResult(result);
}

export const GET = withPublic(handler);
