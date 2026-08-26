import { NextRequest } from "next/server";
import { USER_STATUS } from "@/modules/account/user.constants";
import {
  buildGoogleAuthUrl,
  handleGoogleCallback as handleGoogleCallbackLib,
  issueSession,
  type OAuthState,
} from "@/server/lib/auth";
import { getUserByEmail } from "@/server/modules/account/user.service";
import { logActivity } from "@/server/modules/account/user-activity.service";
import { getClientIp, type ClientInfo } from "@/server/utils/clientInfo";
import type { ApiResult } from "@/types";
import {
  findUserById as repoFindUserById,
  insertUser,
} from "@/server/models/user.repository";
import {
  findAccountByProvider,
  insertUserAccount,
  updateUserAccountTimestamp,
} from "@/server/models/user-account.repository";

export async function initiateGoogle(): Promise<{
  url: URL;
  oauthState: OAuthState;
}> {
  return buildGoogleAuthUrl();
}

export async function handleGoogleCallback(
  req: NextRequest,
  currentUrl: URL,
  oauthState: OAuthState,
  clientInfo: ClientInfo,
): Promise<ApiResult> {
  const googleUser = await handleGoogleCallbackLib(currentUrl, oauthState);

  if (!googleUser.email || !googleUser.email_verified) {
    return {
      http_status: 400,
      status: 0,
      message: "Google account email is not verified",
    };
  }

  // Check if this Google account is already linked
  const existingAccount = await findAccountByProvider("google", googleUser.sub);

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.user_id;

    // Update tokens
    await updateUserAccountTimestamp(existingAccount.id);
  } else {
    // Try to auto-link by email
    const existingUser = await getUserByEmail(googleUser.email);

    if (existingUser) {
      userId = existingUser.id;

      // Link the Google account
      await insertUserAccount({
        account_id: googleUser.sub,
        provider_id: "google",
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      // Create new user + account
      const newUser = await insertUser({
        email: googleUser.email,
        email_verified: true,
        first_name: googleUser.given_name || googleUser.name || "",
        last_name: googleUser.family_name || "",
        image: googleUser.picture || null,
        registered_ip: getClientIp(req),
        created_at: new Date(),
        updated_at: new Date(),
      });
      userId = newUser.id;

      await insertUserAccount({
        account_id: googleUser.sub,
        provider_id: "google",
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  // Check user status
  const user = await repoFindUserById(userId);

  if (!user || user.status !== USER_STATUS.ACTIVE) {
    return { http_status: 403, status: 0, message: "Account is disabled" };
  }

  const { token } = await issueSession(req, userId, { remember: true });
  await logActivity("LOGIN_SUCCESS", userId, clientInfo);

  return {
    http_status: 200,
    status: 1,
    message: "Login successful",
    data: { token },
  };
}
