import { ApiResponse, ApiResult } from "@/types";

export function sendResponse(
  http_status: number = 200,
  result: Partial<ApiResponse> = {},
): Response {
  const body = {
    status: result.status ?? 1,
    message: result.message ?? "",
    data: result.data ?? [],
    ...Object.fromEntries(
      Object.entries(result).filter(
        ([key]) => !["status", "message", "data"].includes(key),
      ),
    ),
  };
  return new Response(JSON.stringify(body), {
    status: http_status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function sendResult(result: Partial<ApiResult>): Response {
  return sendResponse(result.http_status ?? 200, result);
}

export function sendMessage(
  message: string = "Ok",
  status: number = 1,
): Response {
  return sendResponse(200, {
    status: status,
    message,
    data: [],
  });
}

export function sendError(
  http_status: number = 500,
  message: string = "Internal Server Error",
): Response {
  return sendResponse(http_status, {
    status: 0,
    message,
    data: [],
  });
}

export function sendResultWithHeaders(
  result: Partial<ApiResult>,
  headers: Headers,
): Response {
  headers.set("Content-Type", "application/json");
  const { http_status, ...body } = {
    status: result.status ?? 1,
    message: result.message ?? "",
    data: result.data ?? [],
    http_status: result.http_status ?? 200,
  };
  return new Response(JSON.stringify(body), {
    status: http_status,
    headers,
  });
}
