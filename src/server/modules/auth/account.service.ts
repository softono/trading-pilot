import { NextRequest } from "next/server";
import { USER_STATUS } from "@/modules/account/user.constants";
import {
  hashPassword,
  issueOtp,
  verifyOtp,
  issueSession,
  revokeUserSessions,
  createTfaChallenge,
} from "@/server/lib/auth";
import { toSafeUser } from "@/server/modules/account/user.service";
import { sendEmail } from "@/server/lib/mailer";
import { getUserByEmail } from "@/server/modules/account/user.service";
import { logActivity } from "@/server/modules/account/user-activity.service";
import { getClientIp, type ClientInfo } from "@/server/utils/clientInfo";
import type { ApiResult } from "@/types";
import { insertUser, updateUser } from "@/server/models/user.repository";
import {
  insertUserAccount,
  findCredentialAccountByUserId,
  updateUserAccountPassword,
} from "@/server/models/user-account.repository";
import { getPublicSettings } from "@/server/modules/setting/settings.service";

export async function register(
  req: NextRequest,
  body: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
  },
): Promise<ApiResult> {
  const { email, password, first_name, last_name, phone } = body;
  const settings = await getPublicSettings();
  const existing = await getUserByEmail(email);
  if (existing) {
    return {
      http_status: 409,
      status: 0,
      message: "Email already registered",
    };
  }

  const passwordHash = await hashPassword(password);

  const user = await insertUser({
    email,
    email_verified: false,
    first_name,
    last_name,
    phone,
    registered_ip: getClientIp(req),
    created_at: new Date(),
    updated_at: new Date(),
  });

  await insertUserAccount({
    account_id: user.id,
    provider_id: "credential",
    user_id: user.id,
    password: passwordHash,
    created_at: new Date(),
    updated_at: new Date(),
  });

  if (settings.user_email_verify === "1") {
    const otp = await issueOtp("verify", email);
    await sendEmail(email, "otp", {
      first_name,
      last_name,
      email,
      otp,
      message: "Verify your account",
    });

    return {
      http_status: 201,
      status: 1,
      message: "Registration successful. Please verify your email.",
      data: { next: "verify-account", email },
    };
  }

  const { token } = await issueSession(req, user.id, { remember: false });

  return {
    http_status: 201,
    status: 1,
    message: "Registration successful.",
    data: { token, user: toSafeUser(user) },
  };
}

export async function verifyAccount(body: {
  email: string;
  otp: string;
}): Promise<ApiResult> {
  const { email, otp } = body;

  const result = await verifyOtp("verify", email, otp);
  if (!result.valid) {
    return { http_status: 400, status: 0, message: result.message };
  }

  const user = await getUserByEmail(email);
  if (user) {
    await updateUser(user.id, { email_verified: true });
  }

  return { http_status: 200, status: 1, message: "Email verified" };
}

export async function forgotPassword(
  req: NextRequest,
  body: { email: string },
): Promise<ApiResult> {
  const user = await getUserByEmail(body.email);
  if (!user) {
    return {
      http_status: 200,
      status: 1,
      message: "If the email exists, an OTP has been sent",
    };
  }

  const otp = await issueOtp("reset", user.email);
  await sendEmail(user.email, "otp", {
    first_name: user.first_name,
    last_name: user.last_name || "",
    email: user.email,
    otp,
    message: "Reset your password",
  });

  return {
    http_status: 200,
    status: 1,
    message: "If the email exists, an OTP has been sent",
  };
}

export async function resetPassword(body: {
  email: string;
  otp: string;
  password: string;
}): Promise<ApiResult> {
  const { email, otp, password } = body;

  const result = await verifyOtp("reset", email, otp);
  if (!result.valid) {
    return { http_status: 400, status: 0, message: result.message };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  const hash = await hashPassword(password);

  const existing = await findCredentialAccountByUserId(user.id);

  if (existing) {
    await updateUserAccountPassword(existing.id, hash);
  } else {
    await insertUserAccount({
      account_id: user.id,
      provider_id: "credential",
      user_id: user.id,
      password: hash,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Recovery flow: evict every existing session so a compromised session
  // cannot survive the reset.
  await revokeUserSessions(user.id);

  return {
    http_status: 200,
    status: 1,
    message: "Password reset successful",
  };
}

export async function sendOtp(body: {
  email: string;
  type: string;
}): Promise<ApiResult> {
  const { email, type } = body;
  const purpose =
    type === "reset" ? "reset" : type === "signin" ? "signin" : "verify";

  const user = await getUserByEmail(email);
  if (!user) {
    return { http_status: 200, status: 1, message: "OTP sent" };
  }

  const otp = await issueOtp(purpose, email);
  const messageMap: Record<string, string> = {
    signin: "Login",
    verify: "Verify your account",
    reset: "Reset your password",
  };

  await sendEmail(email, "otp", {
    first_name: user.first_name,
    last_name: user.last_name || "",
    email,
    otp,
    message: messageMap[purpose] || "Verification",
  });

  return { http_status: 200, status: 1, message: "OTP sent" };
}

export async function loginWithOtp(
  req: NextRequest,
  body: { email: string; otp: string; remember?: boolean },
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const { email, otp, remember } = body;

  const user = await getUserByEmail(email);
  if (!user) {
    return { http_status: 401, status: 0, message: "Invalid email or OTP" };
  }
  if (user.status !== USER_STATUS.ACTIVE) {
    return { http_status: 403, status: 0, message: "Account is disabled" };
  }
  const settings = await getPublicSettings();
  if (settings.user_email_verify === "1" && !user.email_verified) {
    return {
      http_status: 403,
      status: 0,
      message: "Please verify your email first",
      data: { next: "verify-account", email },
    };
  }

  const result = await verifyOtp("signin", email, otp);
  if (!result.valid) {
    return { http_status: 401, status: 0, message: result.message };
  }

  if (user.two_factor_enabled) {
    const handle = await createTfaChallenge(user.id, !!remember);
    return {
      http_status: 200,
      status: 1,
      message: "Two-factor authentication required",
      data: { next: "tfa", tfaHandle: handle },
    };
  }

  const { token } = await issueSession(req, user.id, {
    remember: !!remember,
  });
  await logActivity("LOGIN_WITH_OTP", user.id, clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Login successful",
    data: { token, user: toSafeUser(user) },
  };
}
