"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { showError, showSuccess } from "@/lib/message";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth, type IUser } from "@/context/AuthContext";
import { authClient } from "@/lib/authClient";
import { safeRedirect } from "@/utils/safeRedirect";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginOtpEmailFormSchema,
  type LoginOtpEmailFormInput,
} from "@/modules/auth/login/login-otp.validator";
import RecaptchaWidget from "@/components/common/recaptcha";

type LoginWithOtpProps = {
  onBack?: () => void;
  googleRecaptchaEnabled: string;
  googleRecaptchaPublicKey: string;
};

export default function LoginWithOtp({
  onBack,
  googleRecaptchaEnabled,
  googleRecaptchaPublicKey,
}: LoginWithOtpProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const otpForm = useForm<LoginOtpEmailFormInput>({
    resolver: zodResolver(loginOtpEmailFormSchema),
    defaultValues: { email: "", otp: "" },
    mode: "onSubmit",
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "signin",
      });
    },
    onSuccess: () => {
      showSuccess("OTP sent successfully");
      setOtpSent(true);
      setEmailForVerification(otpForm.getValues("email"));
      setRecaptchaToken("");
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to send OTP");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const res = await authClient.signIn.emailOtp({ email, otp });
      return res.data;
    },
    onSuccess: (data) => {
      showSuccess("Login successful");
      if (data?.user) {
        login(data.user as IUser);
      }
      router.push(safeRedirect(searchParams.get("redirect"), "/"));
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Invalid OTP");
    },
  });

  const handleBackToPassword = () => {
    setOtpSent(false);
    otpForm.reset({ email: "", otp: "" });
    if (onBack) {
      onBack();
    } else {
      router.push("/login");
    }
  };

  return (
    <Form
      form={otpForm}
      onSubmit={otpForm.handleSubmit((values) => {
        if (!otpSent) {
          if (googleRecaptchaEnabled === "1" && !recaptchaToken) {
            showError("Please complete the captcha verification");
            return;
          }
          sendOtpMutation.mutate(values.email.trim());
        } else {
          verifyOtpMutation.mutate({
            email: emailForVerification.trim(),
            otp: values.otp,
          });
        }
      })}
      className="space-y-4"
    >
      {!otpSent ? (
        <>
          <FormField
            control={otpForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {googleRecaptchaEnabled === "1" && googleRecaptchaPublicKey && (
            <RecaptchaWidget
              onVerify={setRecaptchaToken}
              googleRecaptchaPublicKey={googleRecaptchaPublicKey}
            />
          )}
          <Button className="w-full" type="submit">
            {sendOtpMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Send OTP"
            )}
          </Button>
        </>
      ) : (
        <>
          <FormField
            control={otpForm.control}
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
            type="button"
            variant="link"
            className="w-full"
            onClick={() => {
              sendOtpMutation.mutate(emailForVerification);
            }}
            disabled={sendOtpMutation.isPending}
          >
            {sendOtpMutation.isPending ? "Sending..." : "Resend OTP"}
          </Button>

          <Button className="w-full" type="submit">
            {verifyOtpMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Verify OTP"
            )}
          </Button>
        </>
      )}
      <Button type="button" className="w-full" onClick={handleBackToPassword}>
        Login with Password
      </Button>
    </Form>
  );
}
