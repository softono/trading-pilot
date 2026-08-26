"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { authClient } from "@/lib/authClient";
import { showError, showSuccess } from "@/lib/message";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import RecaptchaWidget from "@/components/common/recaptcha";

export default function ForgotPasswordPage({
  googleRecaptchaEnabled,
  googleRecaptchaPublicKey,
}: {
  googleRecaptchaEnabled: string;
  googleRecaptchaPublicKey: string;
}) {
  const router = useRouter();
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const formStep1 = useForm<{ email: string }>({
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (emailVal: string) => {
      await authClient.emailOtp.sendVerificationOtp({
        email: emailVal,
        type: "reset",
      });
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to send OTP");
    },
  });

  const handleSubmitEmail = async (values: { email: string }) => {
    if (googleRecaptchaEnabled === "1" && !recaptchaToken) {
      showError("Please complete the captcha verification");
      return;
    }

    try {
      await sendOtpMutation.mutateAsync(values.email);

      showSuccess("OTP sent to your email");

      router.push(`/verify?type=forgot_password&code=${btoa(values.email)}`);
    } catch {}
  };
  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Forgot Password?</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Enter your email and we&apos;ll send you instructions to reset your
        password
      </p>

      <Form
        form={formStep1}
        onSubmit={formStep1.handleSubmit(handleSubmitEmail)}
        className="space-y-4"
      >
        <FormItem>
          <FormLabel>
            Email <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder="Enter your email"
              {...formStep1.register("email", {
                required: "Email is required",
              })}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        {googleRecaptchaEnabled === "1" && googleRecaptchaPublicKey && (
          <RecaptchaWidget
            onVerify={setRecaptchaToken}
            googleRecaptchaPublicKey={googleRecaptchaPublicKey}
          />
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={sendOtpMutation.isPending}
        >
          {sendOtpMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Send OTP"
          )}
        </Button>
      </Form>

      <div className="mt-6 text-center">
        <Link
          href="/register"
          className="hover:text-primary underline underline-offset-4"
        >
          Create an account!
        </Link>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-blue-600 hover:underline flex items-center justify-center"
        >
          <span className="mr-1">&larr;</span> Back to login
        </Link>
      </div>
    </>
  );
}
