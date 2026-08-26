"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/message";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { safeRedirect } from "@/utils/safeRedirect";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  verifyFormSchema,
  type VerifyFormInput,
} from "@/modules/auth/verify/verify.validator";
import { OtpInput } from "@/modules/auth/otp/OtpInput";
import { Input } from "@/components/ui/input";
import LoginLinkWaiting from "@/modules/auth/login-link/LoginLinkWaiting";
import type { LoginLinkStart } from "@/lib/authClient";
import {
  Mail,
  KeyRound,
  Ticket,
  Link2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { ComponentType } from "react";

type TfaMethod = "totp" | "otp" | "backup" | "login_link";
type PrimaryMethod = "totp" | "otp";

export default function VerifyPage() {
  const router = useRouter();
  const { logout, refreshSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const type = searchParams.get("type");
  const isForgotPassword = type === "forgot_password";
  const [tfaMethod, setTfaMethod] = useState<TfaMethod | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [loginLink, setLoginLink] = useState<LoginLinkStart | null>(null);
  const [loginLinkSending, setLoginLinkSending] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setTimeout(() => {
      setResendTimer((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (type === "tfa") return;

    if (type === "forgot_password") {
      if (!searchParams.get("code")) {
        showError("Invalid verification link");
        router.push("/password-forgot");
      }
      return;
    }

    if (!searchParams.get("code")) {
      showError("Invalid verification link");
      router.push("/login");
    }
  }, [type, searchParams, router]);

  // Always show all 4 verification methods on the picker —
  // selection (including sending the email OTP) only happens on user click.
  const enabledMethods: PrimaryMethod[] = ["totp", "otp"];

  const form = useForm<VerifyFormInput>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      otp: "",
      trust_device: false,
    },
  });
  const { handleSubmit, control, reset } = form;
  const otp = useWatch({ control, name: "otp", defaultValue: "" });
  const handleSendEmailOtp = async () => {
    // forgot_password flow me do not allow resend via this shared 2FA handler
    if (isForgotPassword) return;

    setEmailSending(true);
    try {
      await authClient.twoFactor.sendOtp();
      showSuccess("Code sent to your email");
      setTfaMethod("otp");
      form.setValue("otp", "");
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to send code"));
    } finally {
      setEmailSending(false);
    }
  };
  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;

    setResendLoading(true);

    try {
      const email = searchParams.get("code")
        ? atob(searchParams.get("code")!)
        : "";

      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: type === "forgot_password" ? "reset" : "signin",
      });

      showSuccess("OTP sent successfully");

      setResendTimer(60);

      reset();
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to resend"));
    } finally {
      setResendLoading(false);
    }
  };
  const handleSendLoginLink = async (): Promise<LoginLinkStart | null> => {
    setLoginLinkSending(true);
    try {
      const res = await authClient.twoFactor.sendLoginLink();
      return res.data as LoginLinkStart;
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to send login link"));
      return null;
    } finally {
      setLoginLinkSending(false);
    }
  };

  const handleSelectMethod = async (method: TfaMethod) => {
    if (method === "otp") {
      handleSendEmailOtp();
      return;
    }
    if (method === "login_link") {
      const data = await handleSendLoginLink();
      if (!data) return;
      setLoginLink(data);
      setTfaMethod("login_link");
      return;
    }
    setTfaMethod(method);
    if (method === "backup") setBackupCode("");
    else form.setValue("otp", "");
  };

  const onSubmit = async (values: VerifyFormInput) => {
    setIsSubmitting(true);

    try {
      if (type === "tfa") {
        const td = values.trust_device ?? false;
        if (tfaMethod === "totp") {
          await authClient.twoFactor.verifyTotp({
            code: values.otp,
            trust_device: td,
          });
        } else if (tfaMethod === "otp") {
          await authClient.twoFactor.verifyOtp({
            code: values.otp,
            trust_device: td,
          });
        }

        await refreshSession();
        showSuccess("Two-factor authentication successful");
        router.push(safeRedirect(searchParams.get("redirect"), "/dashboard"));
      } else if (isForgotPassword) {
        const decodedEmail = searchParams.get("code")
          ? atob(searchParams.get("code")!)
          : "";

        const params = new URLSearchParams({
          email: decodedEmail,
          otp: values.otp,
        });

        router.push(`/reset-password?${params.toString()}`);
      } else {
        await authClient.emailOtp.verifyEmail({
          email: searchParams.get("code")
            ? atob(searchParams.get("code")!)
            : "",
          otp: values.otp,
        });

        showSuccess("Account verified successfully");
        logout();
        router.push("/login");
      }
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Invalid OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackupSubmit = async () => {
    if (!backupCode.trim()) {
      showError("Enter a backup code");
      return;
    }
    setIsSubmitting(true);
    try {
      await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
        trust_device: form.getValues("trust_device") ?? false,
      });
      await refreshSession();
      showSuccess("Two-factor authentication successful");
      router.push(safeRedirect(searchParams.get("redirect"), "/dashboard"));
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Invalid backup code"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodLabels: Record<
    string,
    {
      title: string;
      description: string;
      icon: ComponentType<{ className?: string }>;
    }
  > = {
    totp: {
      title: "Authenticator App",
      description: "Enter the code from your authenticator app",
      icon: KeyRound,
    },
    otp: {
      title: "Email Code",
      description: "We'll send a verification code to your email",
      icon: Mail,
    },
    backup: {
      title: "Backup Code",
      description: "Use one of your saved backup codes",
      icon: Ticket,
    },
    login_link: {
      title: "Magic Link",
      description: "Approve this login from a link sent to your email",
      icon: Link2,
    },
  };

  const backToMethodPicker = () => {
    setTfaMethod(null);
    form.setValue("otp", "");
    setBackupCode("");
    setLoginLink(null);
  };

  // Method selection screen
  if (type === "tfa" && tfaMethod === null) {
    const options: Array<{ method: TfaMethod; loading: boolean }> = [
      ...enabledMethods.map((method) => ({
        method: method as TfaMethod,
        loading: method === "otp" && emailSending,
      })),
      { method: "backup", loading: false },
      { method: "login_link", loading: loginLinkSending },
    ];

    return (
      <div className="space-y-4">
        <h4 className="text-xl font-semibold text-center pt-2">
          Two Step Verification
        </h4>
        <p className="text-center text-muted-foreground">
          Choose a verification method:
        </p>

        <div className="space-y-2">
          {options.map(({ method, loading }) => {
            const { title, description, icon: Icon } = methodLabels[method];
            return (
              <button
                key={method}
                type="button"
                disabled={loading}
                onClick={() => handleSelectMethod(method)}
                className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {loading ? "Sending..." : title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Logout
        </Button>
      </div>
    );
  }

  if (type === "tfa" && tfaMethod === "login_link" && loginLink) {
    return (
      <div className="space-y-4">
        <h4 className="text-xl font-semibold text-center pt-2">
          Two Step Verification
        </h4>
        <LoginLinkWaiting
          initial={loginLink}
          onResend={handleSendLoginLink}
          onCancel={backToMethodPicker}
          onSuccess={async () => {
            await refreshSession();
            showSuccess("Two-factor authentication successful");
            router.push(
              safeRedirect(searchParams.get("redirect"), "/dashboard"),
            );
          }}
        />
      </div>
    );
  }

  if (type === "tfa" && tfaMethod === "backup") {
    return (
      <div className="space-y-4">
        <h4 className="text-xl font-semibold text-center pt-2">
          Two Step Verification
        </h4>
        <p className="text-center text-muted-foreground">
          Enter one of your backup codes.
        </p>

        <div>
          <label className="text-sm font-medium">
            Backup Code <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Enter backup code"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBackupSubmit()}
            className="mt-1 font-mono"
          />
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={isSubmitting || !backupCode.trim()}
          onClick={handleBackupSubmit}
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>

        <button
          type="button"
          className="w-full text-sm text-primary hover:underline"
          onClick={backToMethodPicker}
        >
          Try another way
        </button>

        {type === "tfa" && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Logout
          </Button>
        )}
      </div>
    );
  }

  const currentMethodTitle = tfaMethod
    ? methodLabels[tfaMethod]?.description + "."
    : "";

  return (
    <Form form={form} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h4 className="text-xl font-semibold text-center pt-2 mb-1">
        {isForgotPassword ? "Verify OTP" : "Two Step Verification"}
      </h4>
      <p className="text-center mb-4 text-muted-foreground">
        {type === "tfa"
          ? currentMethodTitle
          : type === "forgot_password"
            ? "Enter the OTP sent to your email."
            : "OTP is sent on your Email Address."}
      </p>

      <FormField
        control={control}
        name="otp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              OTP <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <OtpInput
                value={field.value}
                onChange={(val) => field.onChange(val)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {type !== "tfa" && (
        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            disabled={resendTimer > 0 || resendLoading}
            onClick={handleResend}
            className="underline text-primary disabled:opacity-50"
          >
            {resendLoading
              ? "Resending..."
              : resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Resend OTP"}
          </button>
        </div>
      )}
      {type === "tfa" && (
        <FormField
          control={control}
          name="trust_device"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  Trust this device
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  You won&apos;t be asked for a verification code on this device
                  again.
                </p>
              </div>
            </FormItem>
          )}
        />
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || otp.length !== 6}
      >
        {isSubmitting ? "Verifying..." : "Verify"}
      </Button>

      {type === "tfa" && tfaMethod === "otp" && (
        <button
          type="button"
          className="w-full text-sm text-primary hover:underline disabled:opacity-50"
          onClick={handleSendEmailOtp}
          disabled={emailSending}
        >
          {emailSending ? "Sending..." : "Resend code"}
        </button>
      )}

      {type === "tfa" && (
        <button
          type="button"
          className="w-full text-sm text-primary hover:underline"
          onClick={backToMethodPicker}
        >
          Try another way
        </button>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          if (type === "tfa") {
            logout();
          }
          router.push("/login");
        }}
      >
        {type === "tfa" ? "Logout" : "Back to Login"}
      </Button>
    </Form>
  );
}
