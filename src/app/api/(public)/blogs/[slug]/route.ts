import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { getBySlug } from "@/server/modules/blog/blog.service";
import { withPublic } from "@/server/middleware/withPublic";
import { getClientTimezone } from "@/server/lib/date";

const handler = async (
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await context.params;
  if (!slug) return sendError(400, "Missing slug");

  const tz = getClientTimezone(req);
  const result = await getBySlug(slug, tz);
  return sendResult(result);
};
export const GET = withPublic(handler);
