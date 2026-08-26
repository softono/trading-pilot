"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { showError, showSuccess } from "@/lib/message";
import { httpRequest, getErrorMessage } from "@/lib/httpClient";
import { applyServerErrors } from "@/lib/formErrors";
import { authClient } from "@/lib/authClient";
import type { ApiResponse } from "@/types";
import {
  emailChangeStartSchema,
  type EmailChangeStartInput,
  type EmailChangeVerifyMethod,
} from "@/modules/account/email.validator";
import { EmailChangeVerifyDialog } from "@/modules/account/EmailChangeVerifyDialog";

export function EmailChangeCard() {
  const { user, updateUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<EmailChangeStartInput>({
    resolver: zodResolver(emailChangeStartSchema),
    defaultValues: { email: "", password: "" },
  });

  const closeChallenge = () => {
    setDialogOpen(false);
    setHandle(null);
  };

  const onSubmit = async (data: EmailChangeStartInput) => {
    setIsSubmitting(true);
    try {
      const resp = await httpRequest<ApiResponse>(
        "post",
        "account/email/start",
        data,
      );
      if (resp.status === 1 && resp.data?.handle) {
        setHandle(resp.data.handle as string);
        setNewEmail(data.email);
        setDialogOpen(true);
        showSuccess(resp.message || "Verification code sent to your new email");
      } else {
        showError(resp.message || "Could not start email change");
      }
    } catch (error: unknown) {
      const err = error as {
        data?: { errors?: Record<string, string> };
        message?: string;
      };
      if (err?.data?.errors) applyServerErrors(form.setError, err.data.errors);
      showError(err?.message || "Could not start email change");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyNew = async (
    code: string,
  ): Promise<EmailChangeVerifyMethod[] | null> => {
    if (!handle) return null;
    try {
      const resp = await httpRequest<ApiResponse>(
        "post",
        "account/email/verify-new",
        { handle, code },
      );
      if (resp.status === 1 && resp.data?.methods) {
        return resp.data.methods as EmailChangeVerifyMethod[];
      }
      showError(resp.message || "Invalid code");
      return null;
    } catch (error: unknown) {
      handleChallengeError(error);
      return null;
    }
  };

  const handleVerify = async (
    method: EmailChangeVerifyMethod,
    code: string,
  ): Promise<boolean> => {
    if (!handle || !user) return false;
    try {
      const resp = await httpRequest<ApiResponse>(
        "post",
        "account/email/verify",
        { handle, method, code },
      );
      if (resp.status === 1) {
        updateUser({ ...user, email: newEmail, email_verified: true });
        closeChallenge();
        form.reset({ email: "", password: "" });
        showSuccess(resp.message || "Email updated successfully");
        return true;
      }
      showError(resp.message || "Invalid code");
      return false;
    } catch (error: unknown) {
      handleChallengeError(error);
      return false;
    }
  };

  const handleChallengeError = (error: unknown) => {
    const err = error as { http_status?: number; message?: string };
    showError(getErrorMessage(error, "Verification failed"));
    // Attempt cap hit or challenge expired — restart from password entry.
    if (err?.http_status === 429 || err?.http_status === 401) {
      closeChallenge();
    }
  };

  const handleResendNew = async () => {
    if (!handle) return;
    try {
      await httpRequest<ApiResponse>("post", "account/email/resend", {
        handle,
      });
      showSuccess("Verification code sent to your new email");
    } catch (error: unknown) {
      handleChallengeError(error);
    }
  };

  const handleSendTfaOtp = async () => {
    try {
      await authClient.twoFactor.sendOtp();
      showSuccess("Code sent to your current email");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Could not send code"));
    }
  };

  return (
    <Card className="mb-6 p-8">
      <h5 className="text-lg font-semibold">Email</h5>
      <p className="text-sm text-muted-foreground -mt-4">
        Current email: <span className="font-medium">{user?.email}</span>
        {user && user.email_verified === false && (
          <span className="ml-2 text-amber-600">(Unverified)</span>
        )}
      </p>

      <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  New Email <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your new email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Current Password <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Enter your current password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending code..." : "Change Email"}
          </Button>
        </div>
      </Form>

      <EmailChangeVerifyDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeChallenge();
        }}
        newEmail={newEmail}
        onVerifyNew={handleVerifyNew}
        onResendNew={handleResendNew}
        onVerify={handleVerify}
        onSendTfaOtp={handleSendTfaOtp}
      />
    </Card>
  );
}
