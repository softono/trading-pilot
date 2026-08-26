import { sendResponse } from "@/server/utils/response";

async function handler() {
  return sendResponse(200, {
    data: { stub: true },
    message: "Public settings retrieved",
  });
}

export const GET = handler;
