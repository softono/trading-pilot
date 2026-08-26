import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { getBySlug } from "@/server/modules/public/site.service";
import { withPublic } from "@/server/middleware/withPublic";

export const handler = async (
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await context.params;
  if (!slug) return sendError(400, "Missing slug");

  const result = await getBySlug(slug);
  return sendResult(result);
};
export const GET = withPublic(handler);
