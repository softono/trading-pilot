import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { sendResponse } from "@/server/utils/response";
import { generatePureSitemap } from "@/server/modules/admin/seo/seo.service";
import { NextRequestWithAdmin } from "@/server/middleware/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(_req: NextRequestWithAdmin) {
  const result = await generatePureSitemap();

  return sendResponse(200, {
    status: 1,
    data: result,
    message: "Sitemap updated successfully",
  });
}

export const POST = withAdminAuth(handler);
