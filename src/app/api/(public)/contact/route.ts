import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { contactProcess } from "@/server/modules/public/site.service";
import { contactSchema } from "@/modules/public/contactMessage.validator";
import { withPublic } from "@/server/middleware/withPublic";
import { rateLimit } from "@/server/lib/rateLimit";
import { getClientIp } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const rl = await rateLimit(`contact:${getClientIp(req)}`, 5, 300);
  if (!rl.status) return sendError(429, rl.message || "Too many requests");

  const body = await req.json().catch(() => ({}));
  const validated = validateData(contactSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await contactProcess(req, validated.data);
  return sendResult(result);
}

export const POST = withPublic(handler);
