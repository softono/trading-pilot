import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { withPublic } from "@/server/middleware/withPublic";
import { getPublicProfileBySlug } from "@/server/modules/analyst/analyst-profile.service";

const handler = async (
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await context.params;
  if (!slug) return sendError(400, "Missing slug");

  const result = await getPublicProfileBySlug(slug);
  return sendResult(result);
};

export const GET = withPublic(handler);
