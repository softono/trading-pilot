"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import RecaptchaWidget from "@/components/common/recaptcha";
import { showError } from "@/lib/message";
import {
  adminForgotPasswordFormSchema,
  type AdminForgotPasswordFormInput,
} from "@/server/modules/auth/forgot-password.validator";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";

const ForgotPassword = ({
  googleRecaptchaEnabled,
  googleRecaptchaPublicKey,
}: {
  googleRecaptchaEnabled: string;
  googleRecaptchaPublicKey: string;
}) => {
  const router = useRouter();
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminForgotPasswordFormInput>({
    resolver: zodResolver(adminForgotPasswordFormSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const handleSubmitEmail = async (values: { email: string }) => {
    if (googleRecaptchaEnabled && !recaptchaToken) {
      showError("Please complete the captcha verification");
      return;
    }

    setIsSubmitting(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "reset",
      });
      const params = new URLSearchParams({
        type: "forgot_password",
        code: btoa(values.email),
      });
      router.push(`/admin/auth/verify?${params.toString()}`);
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Unable to send OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-2">Forgot Password? ðŸ”’</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your email and we&apos;ll send you instructions to reset your
          password.
        </p>
      </div>
      <Form
        form={form}
        onSubmit={form.handleSubmit(handleSubmitEmail)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Email <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email"
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Send OTP"}
        </Button>
      </Form>
      <div className="mt-6 text-center">
        <Link
          href="/admin/auth/login"
          className="text-blue-600 hover:underline flex items-center justify-center"
        >
          <span className="mr-1">&larr;</span> Back to login
        </Link>
      </div>
    </>
  );
};

export default ForgotPassword;
