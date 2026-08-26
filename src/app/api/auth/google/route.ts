import { OAuthService } from "@/server/modules/auth";
import { setOAuthStateCookie } from "@/server/utils/authCookie";
import { withPublic } from "@/server/middleware/withPublic";

async function handler() {
  const { url, oauthState } = await OAuthService.initiateGoogle();

  const headers = new Headers();
  setOAuthStateCookie(
    headers,
    oauthState.state,
    oauthState.nonce,
    oauthState.codeVerifier,
  );
  headers.set("Location", url.toString());

  return new Response(null, { status: 302, headers });
}

export const GET = withPublic(handler);
