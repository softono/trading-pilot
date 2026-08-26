import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

export interface LoginLinkStart {
  requestId: string;
  pollToken: string;
  code: string;
  expiresAt: string;
  deviceName: string;
  location: string;
}

export function getGoogleLoginUrl(): string {
  return "/api/auth/google";
}

export const authClient = {
  getSession: (): Promise<ApiResult> =>
    httpRequest<ApiResult>("get", "auth/session"),

  signOut: (): Promise<ApiResult> =>
    httpRequest<ApiResult>("post", "auth/logout"),

  signIn: {
    email: (data: {
      email: string;
      password: string;
      remember?: boolean;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/login", data),

    adminEmail: (data: {
      email: string;
      password: string;
      remember?: boolean;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "admin/auth/login", data),

    emailOtp: (data: {
      email: string;
      otp: string;
      remember?: boolean;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/login-otp", { ...data, step: 2 }),

    passkey: async (): Promise<ApiResult> => {
      const optionsRes: ApiResult = await httpRequest<ApiResult>(
        "post",
        "auth/passkey/login-options",
      );
      const credential = await startAuthentication({
        optionsJSON: optionsRes.data.options,
      });
      return httpRequest<ApiResult>("post", "auth/passkey/login-verify", {
        response: credential,
      });
    },
  },

  signUp: {
    email: (data: Record<string, unknown>): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/register", data),
  },

  loginLink: {
    create: (data: { email: string; remember?: boolean }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/login-link", data),
    poll: (data: {
      requestId: string;
      pollToken: string;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/login-link/poll", data),
    getApproval: (data: {
      requestId: string;
      token: string;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>(
        "get",
        `auth/login-link/approve?id=${data.requestId}&token=${data.token}`,
      ),
    respond: (data: {
      requestId: string;
      token: string;
      action: "approve" | "reject";
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/login-link/approve", data),
  },

  emailOtp: {
    sendVerificationOtp: (data: {
      email: string;
      type: "signin" | "verify" | "reset";
    }): Promise<ApiResult> => httpRequest<ApiResult>("post", "auth/otp", data),
    verifyEmail: (data: { email: string; otp: string }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/verify-account", data),
    resetPassword: (data: {
      email: string;
      otp: string;
      password: string;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/reset-password", {
        ...data,
        confirm_password: data.password,
      }),
  },

  twoFactor: {
    enable: (data: { password: string }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/2fa/enable", data),
    disable: (data: { password: string }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/2fa/disable", data),
    verifyTotp: (data: {
      code: string;
      trust_device?: boolean;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/tfa/verify", {
        ...data,
        method: "totp",
      }),
    verifyOtp: (data: {
      code: string;
      trust_device?: boolean;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/tfa/verify", {
        ...data,
        method: "otp",
      }),
    verifyBackupCode: (data: {
      code: string;
      trust_device?: boolean;
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/tfa/verify", {
        ...data,
        method: "backup",
      }),
    verifySetup: (data: {
      code: string;
      method?: "totp" | "otp";
    }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/2fa/verify-setup", {
        code: data.code,
        method: data.method ?? "totp",
      }),
    sendOtp: (): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/tfa/send-otp"),
    sendLoginLink: (data?: { trust_device?: boolean }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/tfa/send-login-link", data),
    getMethods: (): Promise<ApiResult> =>
      httpRequest<ApiResult>("get", "auth/tfa/methods"),
    generateBackupCodes: (data: { password: string }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/2fa/backup-codes", data),
  },

  passkey: {
    listUserPasskeys: (): Promise<ApiResult> =>
      httpRequest<ApiResult>("get", "auth/passkey/list"),
    addPasskey: async (data: { name?: string }): Promise<ApiResult> => {
      const optionsRes: ApiResult = await httpRequest<ApiResult>(
        "post",
        "auth/passkey/register-options",
      );
      const credential = await startRegistration({
        optionsJSON: optionsRes.data.options,
      });
      return httpRequest<ApiResult>("post", "auth/passkey/register-verify", {
        response: credential,
        name: data.name,
      });
    },
    deletePasskey: (data: { id: string }): Promise<ApiResult> =>
      httpRequest<ApiResult>("post", "auth/passkey/delete", data),
  },

  changePassword: (data: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResult> =>
    httpRequest<ApiResult>("post", "auth/change-password", {
      ...data,
      confirm_password: data.new_password,
    }),

  deleteUser: (): Promise<ApiResult> =>
    httpRequest<ApiResult>("delete", "account/deactivate"),
};
