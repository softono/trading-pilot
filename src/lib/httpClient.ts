import axios from "axios";
import config from "@/config";
import { ApiResult } from "@/types";

function joinUrl(url: string): string {
  const base = (config.API_URL || "").replace(/\/+$/, "");
  return `${base}/${url.replace(/^\/+/, "")}`;
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function normalizeError(err: unknown): ApiResult {
  const axiosErr = err as {
    response?: { data?: Partial<ApiResult>; status?: number };
    message?: string;
  };
  const backend = axiosErr.response?.data ?? {};
  return {
    status: backend.status ?? 0,
    message: backend.message || axiosErr.message || "Something went wrong",
    data: backend.data ?? null,
    http_status: axiosErr.response?.status ?? 500,
  };
}

// --- Session-expiry interceptor ---

const AUTH_EXEMPT_PATTERNS = [
  /\/auth\/login/,
  /\/auth\/login-otp/,
  /\/auth\/login-link/,
  /\/auth\/verify/,
  /\/auth\/resend-otp/,
  /\/auth\/reset-password/,
  /\/auth\/logout/,
  /\/auth\/session/,
  /\/auth\/register/,
  /\/auth\/forgot-password/,
  /\/auth\/otp/,
  /\/auth\/tfa\//,
  /\/auth\/passkey\//,
  /\/auth\/google/,
  /\/register$/,
  /\/site\/forgot-password/,
  /\/account\/view$/,
  /\/admin\/account\/view/,
];

let redirecting = false;

function isExemptUrl(url: string): boolean {
  const path = url.split("?")[0];
  return AUTH_EXEMPT_PATTERNS.some((re) => re.test(path));
}

const axiosInstance = axios.create({ withCredentials: true });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // Session died mid-use: bounce to the matching login. A hard navigation
    // wipes React state and cancels in-flight requests; proxy.ts takes over.
    if (
      status === 401 &&
      !redirecting &&
      !isExemptUrl(url) &&
      typeof window !== "undefined"
    ) {
      redirecting = true;
      const onAdmin = window.location.pathname.startsWith("/admin");
      const loginUrl = onAdmin ? "/admin/auth/login" : "/login";
      const current = window.location.pathname + window.location.search;
      window.location.href = `${loginUrl}?redirect=${encodeURIComponent(current)}`;
    }

    return Promise.reject(error);
  },
);

export function httpRequest<T = unknown>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: unknown,
): Promise<T> {
  return axiosInstance({
    method,
    url: joinUrl(url),
    ...(method === "get" ? { params: data ?? {} } : { data: data ?? {} }),
  })
    .then((res) => res.data as T)
    .catch((err) => {
      throw normalizeError(err);
    });
}
