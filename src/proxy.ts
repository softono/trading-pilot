import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/server/lib/rateLimit";
import { randomAlnum } from "@/server/lib/random";
import { setDeviceCookie, COOKIE_NAMES } from "@/server/utils/authCookie";
import { getClientIp } from "@/server/utils/clientInfo";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasDeviceCookie = Boolean(
    request.cookies.get(COOKIE_NAMES.DEVICE_UID)?.value,
  );

  if (pathname.startsWith("/api")) {
    let limit = 0;
    if (
      pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/admin/auth/login")
    ) {
      limit = 10;
    } else if (
      pathname.startsWith("/api/auth/register") ||
      pathname.startsWith("/api/auth/otp") ||
      pathname.startsWith("/api/auth/login-otp") ||
      pathname.startsWith("/api/auth/tfa") ||
      pathname.startsWith("/api/auth/forgot-password") ||
      pathname.startsWith("/api/auth/reset-password") ||
      pathname.startsWith("/api/auth/verify-account")
    ) {
      limit = 5;
    }

    if (limit > 0) {
      const rateResult = await rateLimit(
        `${pathname}:${getClientIp(request)}`,
        limit,
        15 * 60,
        true,
      );
      if (!rateResult.status) {
        return new Response(
          JSON.stringify({
            status: 0,
            message: "Too many requests, please try again later.",
            data: [],
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(rateResult.reset),
              "X-RateLimit-Limit": String(rateResult.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rateResult.reset),
            },
          },
        );
      }
    }

    return withDeviceCookie(hasDeviceCookie, NextResponse.next());
  }

  const hasSessionCookie = Boolean(
    request.cookies.get(COOKIE_NAMES.SESSION)?.value,
  );
  const redirect = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  if (pathname.startsWith("/admin")) {
    const isAdminAuthPage = pathname.startsWith("/admin/auth");
    if (!hasSessionCookie && !isAdminAuthPage)
      return withDeviceCookie(
        hasDeviceCookie,
        redirect(`/admin/auth/login?redirect=${encodeURIComponent(pathname)}`),
      );
    if (hasSessionCookie && isAdminAuthPage)
      return withDeviceCookie(hasDeviceCookie, redirect("/admin/dashboard"));
    return withDeviceCookie(hasDeviceCookie, NextResponse.next());
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/account")) {
    if (!hasSessionCookie)
      return withDeviceCookie(
        hasDeviceCookie,
        redirect(`/login?redirect=${encodeURIComponent(pathname)}`),
      );
    return withDeviceCookie(hasDeviceCookie, NextResponse.next());
  }

  const authFlowPages = [
    "/verify",
    "/verify-account",
    "/password-forgot",
    "/password-reset",
  ];
  if (authFlowPages.some((p) => pathname.startsWith(p))) {
    return withDeviceCookie(hasDeviceCookie, NextResponse.next());
  }

  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    if (hasSessionCookie)
      return withDeviceCookie(hasDeviceCookie, redirect("/dashboard"));
  }

  return withDeviceCookie(hasDeviceCookie, NextResponse.next());
}

function withDeviceCookie(
  hasDeviceCookie: boolean,
  response: NextResponse,
): NextResponse {
  if (hasDeviceCookie) return response;
  setDeviceCookie(response.headers, randomAlnum(64));
  return response;
}
