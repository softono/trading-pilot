import { sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { flushCache } from "@/server/lib/cache";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(_req: NextRequestWithAdmin) {
  await flushCache();
  return sendResponse(200, {
    status: 1,
    message: "Cache cleared successfully",
  });
}

export const GET = withAdminAuth(handler);
