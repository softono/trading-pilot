"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { AccountBlock } from "@/modules/account/AccountBlock";
import BackupCodes from "@/modules/account/BackupCodesPage";
import { showError, showSuccess } from "@/lib/message";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/authClient";
import { httpRequest, getErrorMessage } from "@/lib/httpClient";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/modules/auth/otp/OtpInput";
import { OtpVerifyDialog } from "@/modules/auth/otp/OtpVerifyDialog";
import { Copy, ShieldCheck, ShieldOff } from "lucide-react";
import QRCode from "qrcode";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { ApiResult } from "@/types";

export default function TwoFactorAuth() {
  const { user, refreshSession } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [password, setPassword] = useState("");

  // Card 1 enable flow
  const [enableLoading, setEnableLoading] = useState(false);
  const [showOtpVerify, setShowOtpVerify] = useState(false);
  const [enableBackupCodes, setEnableBackupCodes] = useState<string[]>([]);
  const [showEnableBackupCodes, setShowEnableBackupCodes] = useState(false);

  const tfaEnabled = user?.two_factor_enabled ?? false;

  // Card 2 authenticator flow
  const [totpVerified, setTotpVerified] = useState(false);
  const [totpLoading, setTotpLoading] = useState(tfaEnabled);
  const [showAuthSetup, setShowAuthSetup] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authStep, setAuthStep] = useState<"password" | "qr" | "verify">(
    "password",
  );
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [authBackupCodes, setAuthBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthBackupCodes, setShowAuthBackupCodes] = useState(false);
  const [showRemoveAuthConfirm, setShowRemoveAuthConfirm] = useState(false);
  const [removeAuthLoading, setRemoveAuthLoading] = useState(false);

  // Social-only password setup
  const [hasCredential, setHasCredential] = useState<boolean | null>(null);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);

  useEffect(() => {
    httpRequest<{ providerId: string }[]>("get", "auth/list-accounts")
      .then((accounts) => {
        setHasCredential(accounts.some((a) => a.providerId === "credential"));
      })
      .catch(() => setHasCredential(true));
  }, []);

  const fetchTotpStatus = () => {
    setTotpLoading(true);
    httpRequest<{ data: { totp_verified: boolean } }>("get", "auth/2fa/status")
      .then((res) => setTotpVerified(res.data?.totp_verified ?? false))
      .catch(() => setTotpVerified(false))
      .finally(() => setTotpLoading(false));
  };

  /* eslint-disable react-hooks/set-state-in-effect -- fetch on mount sets loading/verified state */
  useEffect(() => {
    if (tfaEnabled) fetchTotpStatus();
  }, [tfaEnabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // --- Social password setup ---
  const handleSetPassword = async () => {
    if (!newPassword) {
      showError("Password is required");
      return;
    }
    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    setSetPasswordLoading(true);
    try {
      await httpRequest<ApiResult>("post", "auth/set-password", {
        password: newPassword,
      });
      showSuccess("Password set successfully");
      setHasCredential(true);
      setShowSetPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setSetPasswordLoading(false);
    }
  };

  // --- Card 1: Enable 2FA ---
  const handleEnable = async () => {
    if (!password) {
      showError("Please enter your password");
      return;
    }
    setEnableLoading(true);
    try {
      const res = await authClient.twoFactor.enable({ password });
      setEnableBackupCodes(
        ((res.data as Record<string, unknown>)?.backupCodes as string[]) || [],
      );
      await authClient.twoFactor.sendOtp();
      showSuccess("Verification code sent to your email");
      setShowOtpVerify(true);
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to enable 2FA"));
    } finally {
      setEnableLoading(false);
    }
  };

  const handleEnableVerify = async (code: string): Promise<boolean> => {
    try {
      await authClient.twoFactor.verifySetup({ code, method: "otp" });
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Invalid code"));
      return false;
    }
    showSuccess("Two-factor authentication enabled");
    await refreshSession();
    setShowOtpVerify(false);
    setPassword("");
    fetchTotpStatus();
    if (enableBackupCodes.length > 0) setShowEnableBackupCodes(true);
    return true;
  };

  const handleEnableResend = async () => {
    try {
      await authClient.twoFactor.sendOtp();
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to resend"));
      return;
    }
    showSuccess("Code resent to your email");
  };

  // --- Card 1: Disable 2FA ---
  const handleDisable = async () => {
    if (!password) {
      showError("Please enter your password");
      return;
    }
    setShowDisableConfirm(false);
    setLoading(true);
    try {
      await authClient.twoFactor.disable({ password });
      showSuccess("Two-factor authentication disabled");
      await refreshSession();
      setPassword("");
      setTotpVerified(false);
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to disable 2FA"));
    } finally {
      setLoading(false);
    }
  };

  // --- Card 2: Authenticator setup ---
  const openAuthSetup = () => {
    setAuthPassword("");
    setAuthStep("password");
    setQrDataUrl("");
    setTotpURI("");
    setVerifyCode("");
    setAuthBackupCodes([]);
    setShowAuthSetup(true);
  };

  const handleAuthPasswordSubmit = async () => {
    if (!authPassword) {
      showError("Password is required");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await authClient.twoFactor.enable({ password: authPassword });
      const data = res.data as Record<string, unknown>;
      const uri = data.totpURI as string;
      setTotpURI(uri);
      setAuthBackupCodes((data.backupCodes as string[]) || []);
      const dataUrl = await QRCode.toDataURL(uri, { width: 200, margin: 2 });
      setQrDataUrl(dataUrl);
      setAuthStep("qr");
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to set up authenticator"));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthVerify = async () => {
    if (verifyCode.length !== 6) {
      showError("Enter a 6-digit code");
      return;
    }
    setAuthLoading(true);
    try {
      await authClient.twoFactor.verifySetup({
        code: verifyCode,
        method: "totp",
      });
      showSuccess("Authenticator app configured");
      setShowAuthSetup(false);
      setTotpVerified(true);
      if (authBackupCodes.length > 0) setShowAuthBackupCodes(true);
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Invalid code"));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCopySecret = () => {
    const match = totpURI.match(/secret=([^&]+)/);
    if (match) {
      navigator.clipboard.writeText(match[1]);
      showSuccess("Secret key copied");
    }
  };

  const handleRemoveAuthenticator = async () => {
    setRemoveAuthLoading(true);
    try {
      await httpRequest<ApiResult>("post", "auth/2fa/remove-authenticator");
      showSuccess("Authenticator app removed");
      setTotpVerified(false);
      setShowRemoveAuthConfirm(false);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Failed to remove authenticator",
      );
    } finally {
      setRemoveAuthLoading(false);
    }
  };

  return (
    <>
      <AccountBlock activeTab="Two Factor Authentication" />

      {/* Set password dialog (social-only users) */}
      <AlertDialog open={showSetPassword} onOpenChange={setShowSetPassword}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Set a Password</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Create a password so you can enable two-factor authentication.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 mt-2">
            <PasswordInput
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordInput
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
            />
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowSetPassword(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPassword} disabled={setPasswordLoading}>
              {setPasswordLoading ? "Setting..." : "Set Password"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card 1 enable: OTP verify dialog */}
      <OtpVerifyDialog
        open={showOtpVerify}
        onOpenChange={setShowOtpVerify}
        title="Verify Your Email"
        description="Enter the 6-digit code sent to your email to enable two-factor authentication."
        onVerify={handleEnableVerify}
        onResend={handleEnableResend}
      />

      {/* Backup codes shown after Card 1 enable */}
      <AlertDialog
        open={showEnableBackupCodes}
        onOpenChange={setShowEnableBackupCodes}
      >
        <AlertDialogContent className="sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Your Backup Codes</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Store these codes in a safe place. You can use them to sign in
                if you lose access to your email.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {enableBackupCodes.map((code, i) => (
              <div key={i} className="p-2 border text-center font-mono text-sm">
                {code}
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <Button onClick={() => setShowEnableBackupCodes(false)}>
              Done
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card 2: Authenticator setup dialog */}
      <AlertDialog open={showAuthSetup} onOpenChange={setShowAuthSetup}>
        <AlertDialogContent className="sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {authStep === "password"
                ? "Set Up Authenticator App"
                : authStep === "qr"
                  ? "Scan QR Code"
                  : "Verify Code"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {authStep === "password" &&
                  "Enter your password to set up an authenticator app."}
                {authStep === "qr" &&
                  "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"}
                {authStep === "verify" &&
                  "Enter the 6-digit code from your authenticator app."}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {authStep === "password" && (
            <div className="space-y-4 mt-2">
              <Input
                type="password"
                placeholder="Your password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAuthPasswordSubmit()
                }
              />
            </div>
          )}

          {authStep === "qr" && (
            <div className="flex flex-col items-center justify-center min-h-[280px]">
              {qrDataUrl ? (
                <>
                  <div className="bg-white p-2 rounded">
                    <Image
                      src={qrDataUrl}
                      alt="QR Code"
                      width={200}
                      height={200}
                      className="h-[200px] w-[200px]"
                      style={{ imageRendering: "pixelated" }}
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 font-semibold text-muted-foreground">
                    OR enter the code manually
                  </p>
                  <div className="mt-3 flex w-full max-w-[440px] overflow-hidden rounded border border-border">
                    <input
                      type="text"
                      className="flex-1 border-none bg-background px-5 py-2 text-center text-sm text-foreground outline-none"
                      value={totpURI.match(/secret=([^&]+)/)?.[1] || ""}
                      readOnly
                    />
                    <button
                      onClick={handleCopySecret}
                      className="flex items-center justify-center rounded bg-secondary px-4 hover:bg-secondary/80"
                      aria-label="Copy secret key"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading QR Code...
                  </p>
                </div>
              )}
            </div>
          )}

          {authStep === "verify" && (
            <div className="flex flex-col gap-4 mt-4">
              <OtpInput value={verifyCode} onChange={setVerifyCode} />
            </div>
          )}

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowAuthSetup(false)}>
              Cancel
            </Button>
            {authStep === "password" && (
              <Button onClick={handleAuthPasswordSubmit} disabled={authLoading}>
                {authLoading ? "Setting up..." : "Continue"}
              </Button>
            )}
            {authStep === "qr" && (
              <Button
                onClick={() => {
                  setVerifyCode("");
                  setAuthStep("verify");
                }}
                disabled={!qrDataUrl}
              >
                Next
              </Button>
            )}
            {authStep === "verify" && (
              <Button
                onClick={handleAuthVerify}
                disabled={authLoading || verifyCode.length !== 6}
              >
                {authLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup codes shown after Card 2 authenticator setup */}
      <AlertDialog
        open={showAuthBackupCodes}
        onOpenChange={setShowAuthBackupCodes}
      >
        <AlertDialogContent className="sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Your Backup Codes</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Your backup codes have been regenerated. Store these codes in a
                safe place.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {authBackupCodes.map((code, i) => (
              <div key={i} className="p-2 border text-center font-mono text-sm">
                {code}
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <Button onClick={() => setShowAuthBackupCodes(false)}>Done</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-1 flex-col min-h-[90vh] sm:px-10">
        <div className="space-y-6">
          {/* Card 1: Two-Factor Authentication (master switch) */}
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h5 className="text-lg font-semibold mb-2 text-card-foreground">
                Two-Factor Authentication
              </h5>
              <p className="text-sm text-muted-foreground mb-4">
                {tfaEnabled
                  ? "Two-factor authentication is enabled. You'll be asked for a verification code when signing in."
                  : "Add an extra layer of security to your account by requiring a verification code at sign-in."}
              </p>

              {!tfaEnabled && hasCredential === false && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You signed in with a social provider. Set a password to
                    enable two-factor authentication.
                  </p>
                  <Button
                    onClick={() => {
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowSetPassword(true);
                    }}
                  >
                    Set Password
                  </Button>
                </div>
              )}

              {(tfaEnabled || hasCredential !== false) && (
                <>
                  <div className="mb-4 max-w-sm">
                    <label className="block text-sm font-medium mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  {tfaEnabled ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDisableConfirm(true)}
                      disabled={loading || !password}
                    >
                      {loading
                        ? "Disabling..."
                        : "Disable Two-Factor Authentication"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEnable}
                      disabled={
                        enableLoading || !password || hasCredential === null
                      }
                    >
                      {enableLoading
                        ? "Enabling..."
                        : "Enable Two-Factor Authentication"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 2: Authenticator App */}
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h5 className="text-lg font-semibold mb-2 text-card-foreground">
                Authenticator App
              </h5>
              {totpLoading && tfaEnabled ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : totpVerified ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <ShieldCheck size={18} />
                    <span>Authenticator app is active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can use your authenticator app or email to verify your
                    identity at sign-in.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={openAuthSetup}>
                      Reconfigure
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRemoveAuthConfirm(true)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldOff size={18} />
                    <span>Not configured</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set up an authenticator app for stronger, offline
                    verification codes.
                  </p>
                  <Button onClick={openAuthSetup}>
                    Set Up Authenticator App
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Backup Codes (visible when 2FA is on) */}
          {tfaEnabled && (
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h5 className="text-lg font-semibold mb-2 text-card-foreground">
                  Backup Codes
                </h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Use backup codes to sign in when you don&apos;t have access to
                  your authenticator app or email.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCodes(true)}
                >
                  Regenerate Backup Codes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        title="Disable Two-Factor Authentication"
        description="Are you sure you want to disable two-factor authentication? This will remove your authenticator app and backup codes."
        confirmText="Disable"
        destructive
        onConfirm={handleDisable}
        className="sm:max-w-sm"
      />

      <ConfirmationDialog
        open={showRemoveAuthConfirm}
        onOpenChange={setShowRemoveAuthConfirm}
        title="Remove Authenticator App"
        description="Are you sure? You'll only be able to verify via email after removing the authenticator app."
        confirmText={removeAuthLoading ? "Removing..." : "Remove"}
        destructive
        onConfirm={handleRemoveAuthenticator}
        className="sm:max-w-sm"
      />

      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center pt-16">
          <BackupCodes onClose={() => setShowBackupCodes(false)} />
        </div>
      )}
    </>
  );
}
