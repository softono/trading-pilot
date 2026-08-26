import { NextRequest } from "next/server";
import { USER_STATUS } from "@/modules/account/user.constants";
import {
  getUserByEmail,
  toSafeUser,
} from "@/server/modules/account/user.service";
import {
  checkPassword,
  dummyPasswordCheck,
  hashPassword,
  issueOtp,
  issueSession,
  revokeSession,
  revokeUserSessions,
  createTfaChallenge,
  invalidateUserCache,
  validateSession,
} from "@/server/lib/auth";
import { isDeviceTrusted } from "@/server/modules/auth/device.service";
import { getDeviceUid } from "@/server/utils/authCookie";
import { logActivity } from "@/server/modules/account/user-activity.service";
import { dateTimeFormat } from "@/server/lib/date";
import type { ApiResult } from "@/types";
import { ADMIN_ROLES } from "@/modules/account/user.constants";
import {
  findCredentialAccountByUserId,
  updateCredentialPasswordByUserId,
  insertUserAccount,
} from "@/server/models/user-account.repository";
import { type ClientInfo } from "@/server/utils/clientInfo";
import { sendEmail } from "@/server/lib/mailer";
import { getPublicSettings } from "@/server/modules/setting/settings.service";

export async function getPasswordHash(userId: string): Promise<string | null> {
  const row = await findCredentialAccountByUserId(userId);
  return row?.password ?? null;
}

async function authenticateCredentials(
  req: NextRequest,
  body: { email: string; password: string; remember?: boolean },
  clientInfo: ClientInfo,
  options: { requireAdmin?: boolean } = {},
): Promise<ApiResult> {
  const { email, password, remember } = body;

  const user = await getUserByEmail(email);
  const roleOk =
    !options.requireAdmin ||
    (user && (ADMIN_ROLES as readonly string[]).includes(user.role || ""));
  if (!user || !roleOk) {
    await dummyPasswordCheck();
    return {
      http_status: 401,
      status: 0,
      message: "Invalid email or password",
    };
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    return { http_status: 403, status: 0, message: "Account is disabled" };
  }

  const hash = await getPasswordHash(user.id);
  if (!hash) {
    await dummyPasswordCheck();
    return {
      http_status: 401,
      status: 0,
      message: "Invalid email or password",
    };
  }

  const valid = await checkPassword(hash, password);
  if (!valid) {
    await logActivity("LOGIN_FAILED", user.id, clientInfo);
    return {
      http_status: 401,
      status: 0,
      message: "Invalid email or password",
    };
  }

  const settings = await getPublicSettings();
  if (settings.user_email_verify === "1" && !user.email_verified) {
    const otp = await issueOtp("verify", email);
    await sendEmail(email, "otp", {
      email,
      otp,
      message: "Verify your account",
    });

    return {
      http_status: 403,
      status: 0,
      message: "Please verify your email before logging in",
      data: { next: "verify-account", email: user.email },
    };
  }

  if (user.two_factor_enabled) {
    const deviceUid = getDeviceUid(req);
    const trusted = await isDeviceTrusted(user.id, deviceUid);
    if (!trusted) {
      const handle = await createTfaChallenge(user.id, !!remember);
      return {
        http_status: 200,
        status: 1,
        message: "Two-factor authentication required",
        data: { next: "tfa", tfaHandle: handle },
      };
    }
  }

  const { token } = await issueSession(req, user.id, {
    remember: !!remember,
  });
  await logActivity("LOGIN_SUCCESS", user.id, clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Login successful",
    data: { token, user: toSafeUser(user) },
  };
}

export async function login(
  req: NextRequest,
  body: { email: string; password: string; remember?: boolean },
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  return authenticateCredentials(req, body, clientInfo);
}

export async function adminLogin(
  req: NextRequest,
  body: { email: string; password: string; remember?: boolean },
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  return authenticateCredentials(req, body, clientInfo, { requireAdmin: true });
}

export async function logout(token: string): Promise<ApiResult> {
  await revokeSession(token);
  return { http_status: 200, status: 1, message: "Logged out" };
}

export async function getSession(
  token: string,
  tz: string,
): Promise<ApiResult> {
  const result = await validateSession(token);
  if (!result) {
    return { http_status: 401, status: 0, message: "Invalid session" };
  }
  const user = toSafeUser(result.user);
  return {
    http_status: 200,
    status: 1,
    message: "ok",
    data: {
      user: {
        ...user,
        created_at: dateTimeFormat(user.created_at as Date, tz),
      },
      session: result.session,
    },
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const hash = await getPasswordHash(userId);
  if (!hash) {
    return { http_status: 400, status: 0, message: "No password set" };
  }

  const valid = await checkPassword(hash, currentPassword);
  if (!valid) {
    return {
      http_status: 401,
      status: 0,
      message: "Current password is incorrect",
    };
  }

  const newHash = await hashPassword(newPassword);

  await updateCredentialPasswordByUserId(userId, newHash);

  await invalidateUserCache(userId);
  // Revoke all sessions (including the current one) so the new password is
  // required everywhere; the user re-authenticates after changing it.
  await revokeUserSessions(userId);
  await logActivity("PASSWORD_CHANGED", userId, clientInfo);

  return { http_status: 200, status: 1, message: "Password changed" };
}

export async function setPassword(
  userId: string,
  newPassword: string,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  // Only for accounts without a credential (e.g. OAuth-only). Replacing an
  // existing password must go through changePassword, which verifies it —
  // otherwise a hijacked session could silently take over the account.
  const existing = await getPasswordHash(userId);
  if (existing) {
    return {
      http_status: 400,
      status: 0,
      message: "A password is already set. Use change password instead.",
    };
  }

  const newHash = await hashPassword(newPassword);
  await insertUserAccount({
    account_id: userId,
    provider_id: "credential",
    user_id: userId,
    password: newHash,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await invalidateUserCache(userId);
  await logActivity("PASSWORD_SET", userId, clientInfo);

  return { http_status: 200, status: 1, message: "Password set" };
}
