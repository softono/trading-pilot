"use client";

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { showError, showSuccess } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/authClient";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function AdminVerifyAccountPage() {
  const params = useSearchParams();
  const router = useRouter();
  const email = useMemo(() => {
    const code = params.get("code");
    if (!code) return "";
    try {
      return atob(code);
    } catch {
      return "";
    }
  }, [params]);

  const form = useForm<{ otp: string }>({
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      showError("Invalid verification link");
      router.push("/admin/auth/login");
      return;
    }
    try {
      atob(code);
    } catch {
      showError("Invalid verification link");
      router.push("/admin/auth/login");
    }
  }, [params, router]);

  const verifyMutation = useMutation({
    mutationFn: async (otp: string) => {
      await authClient.emailOtp.verifyEmail({ email, otp });
    },
    onSuccess: () => {
      showSuccess("Email verified successfully! Please login.");
      router.push("/admin/auth/login");
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Verification failed");
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "verify",
      });
    },
    onSuccess: () => {
      showSuccess("OTP resent to your email");
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to resend OTP");
    },
  });

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit((data) => verifyMutation.mutate(data.otp))}
      className="space-y-4"
    >
      <p className="text-sm text-gray-500 text-center">
        Enter the OTP sent to your email
      </p>

      <FormField
        control={form.control}
        name="otp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              OTP <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <InputOTP
                maxLength={6}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                containerClassName="flex items-center gap-2 w-full justify-center"
              >
                <InputOTPGroup className="w-full flex justify-between gap-2">
                  <InputOTPSlot index={0} className="flex-1 min-w-0" />
                  <InputOTPSlot index={1} className="flex-1 min-w-0" />
                  <InputOTPSeparator />
                  <InputOTPSlot index={2} className="flex-1 min-w-0" />
                  <InputOTPSlot index={3} className="flex-1 min-w-0" />
                  <InputOTPSeparator />
                  <InputOTPSlot index={4} className="flex-1 min-w-0" />
                  <InputOTPSlot index={5} className="flex-1 min-w-0" />
                </InputOTPGroup>
              </InputOTP>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={verifyMutation.isPending}
      >
        {verifyMutation.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          "Verify"
        )}
      </Button>

      <Button
        type="button"
        variant="link"
        className="w-full"
        onClick={() => resendMutation.mutate()}
        disabled={resendMutation.isPending}
      >
        {resendMutation.isPending ? "Sending..." : "Resend OTP"}
      </Button>
    </Form>
  );
}
