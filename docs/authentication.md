# Authentication

Detailed reference for the custom auth system. For the short version, see the "Authentication Overview" section in `AGENTS.md`.

## Server libraries (`src/server/lib/auth/`)

| Module         | Purpose                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| `password.ts`  | Argon2id hash/verify via `argon2`                                                    |
| `token.ts`     | `randomBytes(32).base64url` session token generation                                 |
| `ids.ts`       | `crypto.randomUUID()` for all row IDs                                                |
| `totp.ts`      | TOTP secret/verify via `otplib`, hashed backup codes                                 |
| `challenge.ts` | Redis-backed challenges: 2FA-pending (`peek` + `consume` on success only) + WebAuthn |
| `webauthn.ts`  | `@simplewebauthn/server` wrappers (registration + authentication)                    |
| `google.ts`    | Google OAuth via `openid-client` (PKCE + state/nonce), credentials from DB settings  |
| `index.ts`     | Barrel export                                                                        |

## Services (`src/server/services/auth/`)

| Service             | Responsibility                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `authService.ts`    | Login (user + admin), logout, getSession, changePassword, setPassword                                                         |
| `tfaService.ts`     | 2FA: enable/verifySetup/disable, TOTP/OTP/backup login verify, sendOtp, getChallengeMethods, regenerateBackupCodes, getStatus |
| `otpService.ts`     | DB-backed email OTPs (`user_verification` table, hashed, 5-attempt cap): `issueOtp`, `verifyOtp`                              |
| `passkeyService.ts` | Passkey register (options + verify), login (options + verify), list, delete                                                   |
| `oauthService.ts`   | Google OAuth initiate + callback (auto-link by verified email)                                                                |
| `accountService.ts` | Register, verifyAccount, forgotPassword, resetPassword, sendOtp, loginWithOtp                                                 |

## Session model

- **Opaque random token** (`randomBytes(32).base64url`) stored in `user_session.token`.
- **Cookie**: `COOKIE_NAMES.SESSION` (`{APP_UID}_session_token`), httpOnly, SameSite=Lax.
- **Validation**: Redis cache (`auth:session:{token}` + `auth:user:{id}`, 300s TTL) → DB fallback. Write-through sliding refresh bumps `expires_at` when `updated_at` > 24h old.
- **2FA model**: Email OTP is the **default** 2FA method. TOTP (authenticator app) is an **optional add-on** tracked by `user_two_factor.verified` (true only after QR scan + TOTP code verification). `users.two_factor_enabled` is the master switch.
- **2FA login flow**: Login with 2FA enabled does NOT issue a session. A Redis-backed challenge (`auth:2fa:{handle}`) is created, stored in a signed httpOnly cookie. The client fetches available methods via `GET /api/auth/2fa/methods` (always includes `otp`; includes `totp` only if `verified`). The challenge is **peeked** during verification attempts and only **consumed** on success — wrong codes do not destroy the challenge.
- **Row IDs**: All PKs are `text` using `crypto.randomUUID()`.

## API routes

**Public** (`src/app/api/auth/`): `login`, `login-otp`, `register`, `otp`, `verify-account`, `forgot-password`, `reset-password`, `google`, `google/callback`, `2fa/verify`, `2fa/send-otp` (supports both challenge cookie and session), `2fa/methods`, `passkey/login-options`, `passkey/login-verify`.

**Authenticated** (`src/app/api/(user)/auth/`): `logout`, `session`, `set-password`, `change-password`, `list-accounts`, `2fa/enable`, `2fa/verify-setup`, `2fa/disable`, `2fa/status`, `2fa/backup-codes`, `passkey/register-options`, `passkey/register-verify`, `passkey/list`, `passkey/delete`.

**Admin login**: `src/app/api/admin/auth/login` — rejects non-admin roles.

## Client (`src/lib/authClient.ts`)

Exports an `authClient` facade with `{data, error}` return shape plus direct typed functions (`signInEmail`, `tfaEnable`, `passkeyAdd`, etc.). The facade wraps `httpClient` calls to the API routes and `@simplewebauthn/browser` for passkey ceremony. Key 2FA facade methods: `twoFactor.enable`, `twoFactor.sendOtp`, `twoFactor.getMethods`, `twoFactor.verifySetup`, `twoFactor.verifyTotp`, `twoFactor.verifyOtp`, `twoFactor.verifyBackupCode`.

Google login is a top-level redirect (`<a href="/api/auth/google">`), not a fetch.

## Roles & permissions

String-based via `USER_ROLES` from `@/constants/user.constants` (`SUPER_ADMIN`, `ADMIN`, `USER`). `hasPermission()` grants all permissions when `user.role === "SUPER_ADMIN"`. For other roles, permissions are a comma-separated string on `user.permission`.

Single shared session for both frontend and admin — distinguished by role checks in `withAdminAuth`.

## Auth contexts — do not mix

- `src/context/AuthContext.tsx` — public frontend. Uses `authClient.getSession()`. Exposes `useAuth()`.
- `src/context/AdminAuthContext.tsx` — admin panel. Adds inactivity timeout, permission checks. Also exposes `useAuth()` but from a different import path.

## Cookies

All cookies are managed in `COOKIE_NAMES` from `src/server/utils/authCookie.ts`:

| Constant             | Cookie name               | Purpose                                               |
| -------------------- | ------------------------- | ----------------------------------------------------- |
| `SESSION`            | `{APP_UID}_session_token` | Session token                                         |
| `DEVICE_UID`         | `{APP_UID}_device_uid`    | Device fingerprint (set by `proxy.ts` on first visit) |
| `TFA_CHALLENGE`      | `{APP_UID}_tfa`           | Signed 2FA challenge handle                           |
| `WEBAUTHN_CHALLENGE` | `{APP_UID}_wac`           | Signed WebAuthn challenge                             |
| `OAUTH_STATE`        | `{APP_UID}_oauth`         | Signed OAuth state/nonce                              |

The timezone cookie (`{APP_UID}_tz`) is managed separately in `src/server/lib/date.ts` / `src/lib/date.ts`.

`device_uid` is a 64-char random string set by `src/proxy.ts` middleware on the first request (1-year cookie). It is stored in `user_session.device_uid` and used for device listing/management.

**Never hard-code cookie name strings** — always use `COOKIE_NAMES.*` from `@/server/utils/authCookie`.

## Middleware (`src/server/middleware/`)

- `withUserAuth` — validates session via `validateSession(token)`, attaches `req.user` (IUser) and `req.session` (ISession).
- `withAdminAuth` — same + checks `ADMIN_ROLES` + `hasPermission()`.
- Types in `types.ts`: `NextRequestWithUser`, `NextRequestWithAdmin` (both extend `NextRequest` with `user?: IUser`, `session?: IUserSession`).
