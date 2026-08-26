export { hashPassword, checkPassword, dummyPasswordCheck } from "./password";
export { encrypt, decrypt } from "../encryption";
export { generateSessionToken } from "./token";
export {
  issueSession,
  validateSession,
  revokeSession,
  revokeUserSessions,
  invalidateUserCache,
  invalidateSessionCache,
  type SessionWithUser,
} from "@/server/modules/auth/session.service";
export {
  generateTotpSecret,
  getTotpKeyUri,
  verifyTotp,
  generateBackupCodes,
  verifyBackupCode,
} from "./totp";
export { issueOtp, verifyOtp } from "@/server/modules/auth/otp.service";
export {
  createTfaChallenge,
  consumeTfaChallenge,
  peekTfaChallenge,
  bumpTfaAttempts,
  clearTfaAttempts,
  createEmailChangeChallenge,
  peekEmailChangeChallenge,
  markEmailChangeVerified,
  consumeEmailChangeChallenge,
  bumpEmailChangeAttempts,
  type EmailChangePending,
  createWebAuthnChallenge,
  consumeWebAuthnChallenge,
} from "./challenge";
export {
  buildGoogleAuthUrl,
  handleGoogleCallback,
  type GoogleUser,
  type OAuthState,
} from "./google";
export {
  genRegistrationOptions,
  verifyRegistration,
  genAuthenticationOptions,
  verifyAuthentication,
  type UserPasskeyDescriptor,
} from "./webauthn";
