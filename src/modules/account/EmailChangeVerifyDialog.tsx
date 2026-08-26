"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/modules/auth/otp/OtpInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { EmailChangeVerifyMethod } from "@/modules/account/email.validator";

const methodLabels: Record<EmailChangeVerifyMethod, string> = {
  totp: "Authenticator App",
  otp: "Email Code",
  backup: "Backup Code",
};

const methodDescriptions: Record<EmailChangeVerifyMethod, string> = {
  totp: "Enter the 6-digit code from your authenticator app",
  otp: "We sent a code to your current email address",
  backup: "Enter one of your backup codes",
};

type Step = "new-email" | "pick" | "code";

interface EmailChangeVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newEmail: string;
  onVerifyNew: (code: string) => Promise<EmailChangeVerifyMethod[] | null>;
  onResendNew: () => Promise<void>;
  onVerify: (method: EmailChangeVerifyMethod, code: string) => Promise<boolean>;
  onSendTfaOtp: () => Promise<void>;
}

export function EmailChangeVerifyDialog({
  open,
  onOpenChange,
  newEmail,
  onVerifyNew,
  onResendNew,
  onVerify,
  onSendTfaOtp,
}: EmailChangeVerifyDialogProps) {
  const [step, setStep] = useState<Step>("new-email");
  const [methods, setMethods] = useState<EmailChangeVerifyMethod[]>([]);
  const [method, setMethod] = useState<EmailChangeVerifyMethod>("otp");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- resetting dialog state when opened */
  useEffect(() => {
    if (open) {
      setStep("new-email");
      setMethods([]);
      setMethod("otp");
      setCode("");
      setResendTimer(60);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const selectMethod = async (m: EmailChangeVerifyMethod) => {
    setMethod(m);
    setCode("");
    if (m === "otp") {
      setLoading(true);
      try {
        await onSendTfaOtp();
        setResendTimer(60);
      } finally {
        setLoading(false);
      }
    }
    setStep("code");
  };

  const handleVerifyNew = async () => {
    setLoading(true);
    try {
      const result = await onVerifyNew(code);
      if (result) {
        setMethods(result);
        setCode("");
        if (result.length === 1) {
          await selectMethod(result[0]);
        } else {
          setStep("pick");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await onVerify(method, code);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      if (step === "new-email") {
        await onResendNew();
      } else {
        await onSendTfaOtp();
      }
      setResendTimer(60);
      setCode("");
    } finally {
      setResending(false);
    }
  };

  const isNumericCode = step === "new-email" || method !== "backup";
  const codeReady = isNumericCode ? code.length === 6 : code.length > 0;
  const showResend =
    step === "new-email" || (step === "code" && method === "otp");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {step === "new-email"
              ? "Verify New Email"
              : step === "pick"
                ? "Two-Factor Verification"
                : methodLabels[method]}
          </DialogTitle>
          <DialogDescription>
            {step === "new-email"
              ? `Enter the code we sent to ${newEmail}`
              : step === "pick"
                ? "Choose a method to confirm it's you"
                : methodDescriptions[method]}
          </DialogDescription>
        </DialogHeader>

        {step === "pick" ? (
          <div className="flex flex-col gap-2 mt-2">
            {methods.map((m) => (
              <Button
                key={m}
                variant="outline"
                disabled={loading}
                onClick={() => selectMethod(m)}
              >
                {methodLabels[m]}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {isNumericCode ? (
              <OtpInput value={code} onChange={setCode} />
            ) : (
              <Input
                placeholder="Enter backup code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            )}

            {showResend && (
              <div className="text-center text-sm text-muted-foreground">
                Didn&apos;t get the code?{" "}
                <button
                  type="button"
                  disabled={resendTimer > 0 || resending}
                  onClick={handleResend}
                  className="underline text-primary disabled:opacity-50"
                >
                  {resending
                    ? "Resending..."
                    : resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend"}
                </button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "code" && methods.length > 1 && (
            <Button variant="ghost" onClick={() => setStep("pick")}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step !== "pick" && (
            <Button
              onClick={step === "new-email" ? handleVerifyNew : handleVerify}
              disabled={loading || !codeReady}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
