import { NextRequest } from "next/server";
import { sendResult, sendError } from "@/server/utils/response";
import { validateData } from "@/server/lib/validator";
import { AccountService } from "@/server/modules/auth";
import { z } from "zod";
import { withPublic } from "@/server/middleware/withPublic";

const schema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Please provide a valid email address"),
});

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = validateData(schema, body);
    if (!validated.status) return sendResult(validated);
    return sendResult(await AccountService.forgotPassword(req, validated.data));
  } catch {
    return sendError(500, "An unexpected error occurred");
  }
}
export const POST = withPublic(handler);
