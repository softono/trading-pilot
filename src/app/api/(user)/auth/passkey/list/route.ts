import { sendResult } from "@/server/utils/response";
import { PasskeyService } from "@/server/modules/auth";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import type { NextRequestWithUser } from "@/server/middleware/types";
import { getClientTimezone } from "@/server/lib/date";

async function handler(req: NextRequestWithUser) {
  return sendResult(
    await PasskeyService.list(req.user!.id, getClientTimezone(req)),
  );
}

export const GET = withUserAuth(handler);
