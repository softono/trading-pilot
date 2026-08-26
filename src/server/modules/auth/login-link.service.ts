import { randomInt, randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { type IUserLoginLink } from "@/server/models/schema";
import { USER_STATUS } from "@/modules/account/user.constants";
import {
  insertLoginLink,
  findLoginLinkById,
  updateLoginLinkStatus,
  updateLoginLinkResponse,
  claimApprovedLoginLink,
} from "@/server/models/user-login-link.repository";
import {
  hashPassword,
  checkPassword,
  generateSessionToken,
  issueSession,
  peekTfaChallenge,
  consumeTfaChallenge,
} from "@/server/lib/auth";
import {
  getUserByEmail,
  getUserById,
} from "@/server/modules/account/user.service";
import { trustDevice } from "@/server/modules/auth/device.service";
import { toSafeUser } from "@/server/modules/account/user.service";
import { logActivity } from "@/server/modules/account/user-activity.service";
import { sendEmail } from "@/server/lib/mailer";
import {
  getClientIp,
  getUserAgent,
  type ClientInfo,
} from "@/server/utils/clientInfo";
import { getBrowserdeviceName } from "@/utils/general";
import { getIpLocation } from "@/utils/ipinfo";
import config from "@/server/config";
import type { ApiResult } from "@/types";

const CODE_LENGTH = 6;

function generateCode(): string {
  const max = Math.pow(10, CODE_LENGTH);
  const min = Math.pow(10, CODE_LENGTH - 1);
  return String(randomInt(min, max));
}

async function buildRequestContext(req: NextRequest) {
  const ip = getClientIp(req);
  const deviceName = getBrowserdeviceName(getUserAgent(req));
  const location = await getIpLocation(ip);
  return { ip, deviceName, location };
}

export async function createSignin(
  req: NextRequest,
  body: { email: string; remember?: boolean },
): Promise<ApiResult> {
  const email = body.email.toLowerCase();
  const pollToken = generateSessionToken();
  const linkToken = generateSessionToken();
  const code = generateCode();
  const expiresAt = new Date(Date.now() + config.LOGIN_LINK_EXPIRE_SEC * 1000);
  const { ip, deviceName, location } = await buildRequestContext(req);

  const user = await getUserByEmail(email);
  let requestId: string = randomUUID();

  if (user && user.status === USER_STATUS.ACTIVE) {
    const row = await insertLoginLink({
      purpose: "signin",
      email,
      user_id: user.id,
      poll_token_hash: await hashPassword(pollToken),
      link_token_hash: await hashPassword(linkToken),
      code,
      status: "pending",
      device_name: deviceName,
      location,
      ip,
      remember: !!body.remember,
      expires_at: expiresAt,
    });
    requestId = row.id;

    const link = `${config.BASE_URL}/login/approve?id=${requestId}&token=${linkToken}`;
    await sendEmail(user.email, "login-link", {
      first_name: user.first_name,
      last_name: user.last_name || "",
      email: user.email,
      link,
      message: "Login",
    });
  }

  return {
    http_status: 200,
    status: 1,
    message: "If the email exists, a login link has been sent",
    data: {
      requestId,
      pollToken,
      code,
      expiresAt: expiresAt.toISOString(),
      deviceName,
      location,
    },
  };
}

export async function createTfa(
  req: NextRequest,
  tfaHandle: string,
  trustDeviceFlag = false,
): Promise<ApiResult> {
  const pending = await peekTfaChallenge(tfaHandle);
  if (!pending) {
    return { http_status: 401, status: 0, message: "Challenge expired" };
  }

  const user = await getUserById(pending.userId);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  const pollToken = generateSessionToken();
  const linkToken = generateSessionToken();
  const code = generateCode();
  const expiresAt = new Date(Date.now() + config.LOGIN_LINK_EXPIRE_SEC * 1000);
  const { ip, deviceName, location } = await buildRequestContext(req);

  const row = await insertLoginLink({
    purpose: "tfa",
    email: user.email,
    user_id: user.id,
    poll_token_hash: await hashPassword(pollToken),
    link_token_hash: await hashPassword(linkToken),
    code,
    status: "pending",
    device_name: deviceName,
    location,
    ip,
    remember: pending.remember,
    trust_device: trustDeviceFlag,
    tfa_handle: tfaHandle,
    expires_at: expiresAt,
  });

  const link = `${config.BASE_URL}/login/approve?id=${row.id}&token=${linkToken}`;
  await sendEmail(user.email, "login-link", {
    first_name: user.first_name,
    last_name: user.last_name || "",
    email: user.email,
    link,
    message: "Login verification",
  });

  return {
    http_status: 200,
    status: 1,
    message: "Login link sent",
    data: {
      requestId: row.id,
      pollToken,
      code,
      expiresAt: expiresAt.toISOString(),
      deviceName,
      location,
    },
  };
}

export async function poll(
  req: NextRequest,
  body: { requestId: string; pollToken: string },
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const row = await findLoginLinkById(body.requestId);

  if (!row) {
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: "pending" },
    };
  }

  const validToken = await checkPassword(row.poll_token_hash, body.pollToken);
  if (!validToken) {
    // Same response as an unknown requestId so callers can't distinguish
    // valid request ids by probing with bad poll tokens.
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: "pending" },
    };
  }

  if (row.status === "pending" && row.expires_at < new Date()) {
    await updateLoginLinkStatus(row.id, "expired");
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: "expired" },
    };
  }

  if (row.status === "pending") {
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: "pending" },
    };
  }

  if (row.status === "rejected") {
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: "rejected" },
    };
  }

  if (row.status !== "approved") {
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: "expired" },
    };
  }

  const claimed = await claimApprovedLoginLink(row.id);
  if (!claimed) {
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: "pending" },
    };
  }

  return finalizeApprovedLogin(req, claimed, clientInfo);
}

export async function getApprovalInfo(
  requestId: string,
  linkToken: string,
): Promise<ApiResult> {
  const row = await lookupByLinkToken(requestId, linkToken);
  if (!row) {
    return {
      http_status: 404,
      status: 0,
      message: "Invalid or expired link",
    };
  }
  if (row.status !== "pending" || row.expires_at < new Date()) {
    return {
      http_status: 200,
      status: 1,
      message: "ok",
      data: { state: row.status === "pending" ? "expired" : row.status },
    };
  }
  return {
    http_status: 200,
    status: 1,
    message: "ok",
    data: {
      state: "pending",
      code: row.code,
      deviceName: row.device_name,
      location: row.location,
    },
  };
}

export async function respond(
  requestId: string,
  linkToken: string,
  action: "approve" | "reject",
): Promise<ApiResult> {
  const row = await lookupByLinkToken(requestId, linkToken);
  if (!row) {
    return {
      http_status: 404,
      status: 0,
      message: "Invalid or expired link",
    };
  }
  if (row.status !== "pending" || row.expires_at < new Date()) {
    return {
      http_status: 400,
      status: 0,
      message: "This link is no longer valid",
    };
  }

  await updateLoginLinkResponse(
    row.id,
    action === "approve" ? "approved" : "rejected",
    action === "approve" ? new Date() : null,
  );

  return {
    http_status: 200,
    status: 1,
    message: action === "approve" ? "Login approved" : "Login rejected",
  };
}

async function lookupByLinkToken(
  requestId: string,
  linkToken: string,
): Promise<IUserLoginLink | null> {
  const row = await findLoginLinkById(requestId);
  if (!row) return null;
  const valid = await checkPassword(row.link_token_hash, linkToken);
  if (!valid) return null;
  return row;
}

async function finalizeApprovedLogin(
  req: NextRequest,
  row: IUserLoginLink,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  if (row.purpose === "tfa" && row.tfa_handle) {
    const pending = await consumeTfaChallenge(row.tfa_handle);
    if (!pending) {
      return { http_status: 401, status: 0, message: "Challenge expired" };
    }
  }

  const user = await getUserById(row.user_id);
  if (!user) {
    return { http_status: 404, status: 0, message: "User not found" };
  }

  if (row.purpose === "tfa" && row.trust_device) {
    await trustDevice(req, user.id);
  }

  const { token } = await issueSession(req, user.id, {
    remember: row.remember,
  });
  await logActivity(
    row.purpose === "tfa" ? "LOGIN_SUCCESS" : "LOGIN_WITH_LINK",
    user.id,
    clientInfo,
  );

  return {
    http_status: 200,
    status: 1,
    message: "Login successful",
    data: {
      state: "success",
      token,
      remember: row.remember,
      user: toSafeUser(user),
    },
  };
}
