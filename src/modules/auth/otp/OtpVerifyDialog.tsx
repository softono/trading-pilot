"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "./OtpInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface OtpVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onVerify: (code: string) => Promise<boolean>;
  onResend?: () => Promise<void>;
  showResend?: boolean;
}

export function OtpVerifyDialog({
  open,
  onOpenChange,
  title,
  description,
  onVerify,
  onResend,
  showResend = true,
}: OtpVerifyDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- resetting dialog state when opened */
  useEffect(() => {
    if (open) {
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

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await onVerify(code);
    } finally {
      setLoading(false);
    }
  }, [code, onVerify]);

  const handleResend = async () => {
    if (!onResend || resendTimer > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setResendTimer(60);
      setCode("");
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <OtpInput value={code} onChange={setCode} />

          {showResend && onResend && (
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
