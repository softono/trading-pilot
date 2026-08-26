import { createHmac, timingSafeEqual } from "crypto";
import config from "@/server/config";

const IS_PROD = config.APP_ENV === "production";
const APP_UID = config.APP_UID;
const SECRET = config.ENCRYPTION_KEY;

const COOKIE_ATTRS = `HttpOnly; Path=/; SameSite=Lax${IS_PROD ? "; Secure" : ""}`;

export const COOKIE_NAMES = {
  SESSION: `${APP_UID}_session_token`,
  DEVICE_UID: `${APP_UID}_device_uid`,
  TFA_CHALLENGE: `${APP_UID}_tfa`,
  WEBAUTHN_CHALLENGE: `${APP_UID}_wac`,
  OAUTH_STATE: `${APP_UID}_oauth`,
} as const;

// --- Device UID ---

export function getDeviceUid(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): string {
  return req.cookies.get(COOKIE_NAMES.DEVICE_UID)?.value ?? "";
}

export function setDeviceCookie(headers: Headers, uid: string) {
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.DEVICE_UID}=${uid}; ${COOKIE_ATTRS}; Max-Age=31536000`,
  );
}

// --- Session cookie ---

export function getSessionToken(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): string {
  return req.cookies.get(COOKIE_NAMES.SESSION)?.value ?? "";
}

export function setSessionCookie(
  headers: Headers,
  token: string,
  options: { remember?: boolean } = {},
) {
  const maxAge = options.remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.SESSION}=${token}; ${COOKIE_ATTRS}; Max-Age=${maxAge}`,
  );
}

export function clearSessionCookie(headers: Headers) {
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.SESSION}=; ${COOKIE_ATTRS}; Max-Age=0`,
  );
}

// --- Signed short-lived cookies (2FA challenge, WebAuthn, OAuth state) ---

function sign(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifySignature(cookie: string): string | null {
  const idx = cookie.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = cookie.slice(0, idx);
  const sig = cookie.slice(idx + 1);
  const expected = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  return payload;
}

// --- 2FA challenge cookie ---

export function setTfaChallengeCookie(headers: Headers, handle: string) {
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.TFA_CHALLENGE}=${sign(handle)}; ${COOKIE_ATTRS}; Max-Age=600`,
  );
}

export function getTfaChallengeHandle(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): string | null {
  const cookie = req.cookies.get(COOKIE_NAMES.TFA_CHALLENGE)?.value ?? "";
  if (!cookie) return null;
  return verifySignature(cookie);
}

export function clearTfaChallengeCookie(headers: Headers) {
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.TFA_CHALLENGE}=; ${COOKIE_ATTRS}; Max-Age=0`,
  );
}

// --- WebAuthn challenge cookie ---

export function setWebAuthnChallengeCookie(headers: Headers, handle: string) {
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.WEBAUTHN_CHALLENGE}=${sign(handle)}; ${COOKIE_ATTRS}; Max-Age=300`,
  );
}

export function getWebAuthnChallengeHandle(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): string | null {
  const cookie = req.cookies.get(COOKIE_NAMES.WEBAUTHN_CHALLENGE)?.value ?? "";
  if (!cookie) return null;
  return verifySignature(cookie);
}

export function clearWebAuthnChallengeCookie(headers: Headers) {
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.WEBAUTHN_CHALLENGE}=; ${COOKIE_ATTRS}; Max-Age=0`,
  );
}

// --- OAuth state cookie (signed, carries state+nonce+codeVerifier) ---

export function setOAuthStateCookie(
  headers: Headers,
  state: string,
  nonce: string,
  codeVerifier: string,
) {
  const payload = Buffer.from(
    JSON.stringify({ state, nonce, codeVerifier }),
  ).toString("base64url");
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.OAUTH_STATE}=${sign(payload)}; ${COOKIE_ATTRS}; Max-Age=600`,
  );
}

export function getOAuthState(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): { state: string; nonce: string; codeVerifier: string } | null {
  const cookie = req.cookies.get(COOKIE_NAMES.OAUTH_STATE)?.value ?? "";
  if (!cookie) return null;
  const payload = verifySignature(cookie);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export function clearOAuthStateCookie(headers: Headers) {
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAMES.OAUTH_STATE}=; ${COOKIE_ATTRS}; Max-Age=0`,
  );
}
