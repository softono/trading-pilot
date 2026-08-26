import { sendResponse } from "@/server/utils/response";

async function handler() {
  return sendResponse(200, {
    data: {
      app: "API",
      version: "1.0.0",
      status: "healthy",
    },
    message: "API is running",
  });
}

export const GET = handler;
