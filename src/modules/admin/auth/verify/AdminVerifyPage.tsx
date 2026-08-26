"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { showError, showSuccess } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/modules/auth/otp/OtpInput";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { useAuth } from "@/context/AdminAuthContext";
import { safeRedirect } from "@/utils/safeRedirect";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminVerifyFormSchema,
  type AdminVerifyFormInput,
} from "@/server/modules/auth/verify.validator";
import { Mail, KeyRound, Ticket, ChevronRight } from "lucide-react";
import type { ComponentType } from "react";

type TfaMethod = "totp" | "otp" | "backup";

function parseEnabledMethods(searchParams: URLSearchParams): TfaMethod[] {
  const raw = searchParams.get("methods") || "";
  if (!raw) return ["totp", "otp"];
  return raw
    .split(",")
    .filter((m): m is TfaMethod => ["totp", "otp"].includes(m));
}

const VerifyPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login } = useAuth();

  const type = searchParams.get("type") || "tfa";
  const code = searchParams.get("code") || "";

  const enabledMethods = parseEnabledMethods(searchParams);
  const defaultMethod = enabledMethods.length === 1 ? enabledMethods[0] : null;

  const [tfaMethod, setTfaMethod] = useState<TfaMethod | null>(
    defaultMethod === "otp" ? null : defaultMethod,
  );
  const [emailSending, setEmailSending] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [autoSent, setAutoSent] = useState(false);

  useEffect(() => {
    if (type === "tfa" && defaultMethod === "otp" && !autoSent) {
      setAutoSent(true);
      setEmailSending(true);
      authClient.twoFactor
        .sendOtp()
        .then(() => {
          showSuccess("Code sent to your email");
          setTfaMethod("otp");
        })
        .catch((err: unknown) => {
          showError(getErrorMessage(err, "Failed to send code"));
        })
        .finally(() => {
          setEmailSending(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<AdminVerifyFormInput>({
    resolver: zodResolver(adminVerifyFormSchema),
    defaultValues: { otp: "" },
  });
  const { handleSubmit, control, reset, watch } = form;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const completeLogin = async () => {
    const session = await authClient.getSession();
    if (session.data?.user) {
      login(session.data.user as Parameters<typeof login>[0]);
      showSuccess("Verification successful");
      router.push(
        safeRedirect(searchParams.get("redirect"), "/admin/dashboard"),
      );
    } else {
      showError("Verified, but session could not be loaded.");
    }
  };

  const handleSendEmailOtp = async () => {
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

  const handleSelectMethod = (method: TfaMethod) => {
    if (method === "otp") {
      handleSendEmailOtp();
      return;
    }
    setTfaMethod(method);
    if (method === "backup") setBackupCode("");
    else form.setValue("otp", "");
  };

  const onSubmit = async (data: AdminVerifyFormInput) => {
    setIsSubmitting(true);
    try {
      if (type === "tfa") {
        if (tfaMethod === "totp") {
          await authClient.twoFactor.verifyTotp({ code: data.otp });
        } else if (tfaMethod === "otp") {
          await authClient.twoFactor.verifyOtp({ code: data.otp });
        }
        await completeLogin();
      } else if (type === "forgot_password") {
        const email = code ? atob(code) : "";
        const params = new URLSearchParams({
          email,
          otp: data.otp,
        });
        router.push(`/admin/auth/reset_password?${params.toString()}`);
      } else {
        await authClient.emailOtp.verifyEmail({
          email: code ? atob(code) : "",
          otp: data.otp,
        });
        await completeLogin();
      }
    } catch (err: unknown) {
      showError(getErrorMessage(err, "OTP verification failed"));
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
      });
      await completeLogin();
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Invalid backup code"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const email = code ? atob(code) : "";
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
  };

  const backToMethodPicker = () => {
    setTfaMethod(null);
    form.setValue("otp", "");
    setBackupCode("");
  };

  // Method selection screen
  if (type === "tfa" && tfaMethod === null) {
    const options: Array<{ method: TfaMethod; loading: boolean }> = [
      ...enabledMethods.map((method) => ({
        method,
        loading: method === "otp" && emailSending,
      })),
      { method: "backup", loading: false },
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
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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

        <div className="text-center">
          <a
            href="/admin/auth/login"
            className="text-blue-600 hover:underline flex items-center justify-center"
          >
            <span className="mr-1">&larr;</span> Back to login
          </a>
        </div>
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

        <div className="text-center">
          <a
            href="/admin/auth/login"
            className="text-blue-600 hover:underline flex items-center justify-center"
          >
            <span className="mr-1">&larr;</span> Back to login
          </a>
        </div>
      </div>
    );
  }

  const currentMethodTitle = tfaMethod
    ? methodLabels[tfaMethod]?.description + "."
    : "";

  return (
    <Form form={form} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h4 className="text-xl font-semibold text-center pt-2">
        Two Step Verification
      </h4>
      <p className="text-center text-muted-foreground">
        {type === "tfa"
          ? currentMethodTitle
          : "OTP has been sent to your email."}
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
              <OtpInput value={field.value} onChange={field.onChange} />
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

      <Button
        type="submit"
        className="w-full"
        // eslint-disable-next-line react-hooks/incompatible-library
        disabled={isSubmitting || watch("otp").length !== 6}
      >
        {isSubmitting ? "Verifying..." : "Verify OTP"}
      </Button>

      {type === "tfa" && (
        <button
          type="button"
          className="w-full text-sm text-primary hover:underline"
          onClick={backToMethodPicker}
        >
          Try another way
        </button>
      )}

      <div className="text-center">
        <a
          href="/admin/auth/login"
          className="text-blue-600 hover:underline flex items-center justify-center"
        >
          <span className="mr-1">&larr;</span> Back to login
        </a>
      </div>
    </Form>
  );
};

export default VerifyPage;
