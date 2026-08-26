import {
  discovery,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  randomState,
  randomNonce,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  type Configuration,
} from "openid-client";
import { getSetting } from "@/server/modules/setting/settings.service";
import config from "@/server/config";

const GOOGLE_ISSUER = "https://accounts.google.com";

let cachedConfig: Configuration | null = null;
let cachedClientId: string | null = null;

async function getOidcConfig(): Promise<{
  oidcConfig: Configuration;
  clientId: string;
}> {
  const clientId = (await getSetting("google_client_id")) || "";
  const clientSecret = (await getSetting("google_client_secret")) || "";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  if (cachedConfig && cachedClientId === clientId) {
    return { oidcConfig: cachedConfig, clientId };
  }

  const oidcConfig = await discovery(
    new URL(GOOGLE_ISSUER),
    clientId,
    clientSecret,
  );
  cachedConfig = oidcConfig;
  cachedClientId = clientId;

  return { oidcConfig, clientId };
}

function getRedirectUri(): string {
  return `${config.BASE_URL}/api/auth/google/callback`;
}

export interface OAuthState {
  state: string;
  nonce: string;
  codeVerifier: string;
}

export async function buildGoogleAuthUrl(): Promise<{
  url: URL;
  oauthState: OAuthState;
}> {
  const { oidcConfig } = await getOidcConfig();
  const state = randomState();
  const nonce = randomNonce();
  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

  const params = new URLSearchParams();
  params.set("redirect_uri", getRedirectUri());
  params.set("scope", "openid email profile");
  params.set("state", state);
  params.set("nonce", nonce);
  params.set("code_challenge", codeChallenge);
  params.set("code_challenge_method", "S256");

  const url = buildAuthorizationUrl(oidcConfig, params);

  return { url, oauthState: { state, nonce, codeVerifier } };
}

export interface GoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function handleGoogleCallback(
  currentUrl: URL,
  oauthState: OAuthState,
): Promise<GoogleUser> {
  const { oidcConfig } = await getOidcConfig();

  const tokens = await authorizationCodeGrant(oidcConfig, currentUrl, {
    pkceCodeVerifier: oauthState.codeVerifier,
    expectedState: oauthState.state,
    expectedNonce: oauthState.nonce,
    idTokenExpected: true,
  });

  const claims = tokens.claims();
  if (claims && claims.sub) {
    return {
      sub: claims.sub as string,
      email: (claims.email as string) || "",
      email_verified: (claims.email_verified as boolean) ?? false,
      name: (claims.name as string) || "",
      given_name: claims.given_name as string | undefined,
      family_name: claims.family_name as string | undefined,
      picture: claims.picture as string | undefined,
    };
  }

  const userInfo = await fetchUserInfo(
    oidcConfig,
    tokens.access_token,
    (claims?.sub as string) || "",
  );

  return {
    sub: userInfo.sub as string,
    email: (userInfo.email as string) || "",
    email_verified: (userInfo.email_verified as boolean) ?? false,
    name: (userInfo.name as string) || "",
    given_name: userInfo.given_name as string | undefined,
    family_name: userInfo.family_name as string | undefined,
    picture: userInfo.picture as string | undefined,
  };
}
