import { NextRequest } from "next/server";
import { OAuthService } from "@/server/modules/auth";
import {
  getOAuthState,
  clearOAuthStateCookie,
  setSessionCookie,
} from "@/server/utils/authCookie";
import config from "@/server/config";
import { withPublic } from "@/server/middleware/withPublic";

import { getClientInfo } from "@/server/utils/clientInfo";

async function handler(req: NextRequest) {
  const oauthState = getOAuthState(req);
  if (!oauthState) {
    return Response.redirect(`${config.BASE_URL}/login?error=invalid_state`);
  }

  const clientInfo = getClientInfo(req);
  const result = await OAuthService.handleGoogleCallback(
    req,
    new URL(req.url),
    oauthState,
    clientInfo,
  );

  const headers = new Headers();
  clearOAuthStateCookie(headers);

  if (result.status === 1 && result.data?.token) {
    setSessionCookie(headers, result.data.token, { remember: true });
    headers.set("Location", config.BASE_URL);
    return new Response(null, { status: 302, headers });
  }

  headers.set(
    "Location",
    `${config.BASE_URL}/login?error=${encodeURIComponent(result.message)}`,
  );
  return new Response(null, { status: 302, headers });
}

export const GET = withPublic(handler);
