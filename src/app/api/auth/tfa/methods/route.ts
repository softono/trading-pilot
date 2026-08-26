import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { TfaService } from "@/server/modules/auth";
import { getTfaChallengeHandle } from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";

async function handler(req: NextRequest) {
  const tfaHandle = getTfaChallengeHandle(req);
  if (!tfaHandle) return sendError(401, "No 2FA challenge found");

  return sendResult(await TfaService.getChallengeMethods(tfaHandle));
}
export const GET = withPublic(handler);
