"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showMessage, showError } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient, getGoogleLoginUrl } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { useAuth, type IUser } from "@/context/AuthContext";
import LoginWithOtp from "./LoginWithOtp";
import LoginWithLoginLink from "../login-link/LoginWithLoginLink";
import { safeRedirect } from "@/utils/safeRedirect";
import {
  loginFormSchema,
  type LoginFormInput,
} from "@/modules/auth/login/login.validator";

export default function Login({
  userLoginWithOtp,
  googleRecaptchaEnabled,
  googleRecaptchaPublicKey,
}: {
  userLoginWithOtp: string;
  googleRecaptchaEnabled: string;
  googleRecaptchaPublicKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, refreshSession } = useAuth();
  const [showOtp, setShowOtp] = useState(false);
  const [showLoginLink, setShowLoginLink] = useState(false);

  useEffect(() => {
    if (isAuthenticated)
      router.push(safeRedirect(searchParams.get("redirect"), "/"));
  }, [isAuthenticated, router, searchParams]);

  const form = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", remember: true },
    mode: "onSubmit",
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_email");
    if (savedEmail) {
      form.setValue("email", savedEmail);
      form.setValue("remember", true);
    }
  }, [form]);

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormInput) => {
      const res = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        remember: values.remember,
      });
      return res.data;
    },

    onSuccess: (data) => {
      if ((data as Record<string, unknown>)?.next === "tfa") {
        const sp = new URLSearchParams({ type: "tfa" });
        const redirect = searchParams.get("redirect");
        if (redirect) sp.set("redirect", redirect);
        router.push(`/verify?${sp.toString()}`);
        return;
      }

      showMessage({ status: 1, message: "Login successful" });

      if (form.getValues("remember")) {
        localStorage.setItem("saved_email", form.getValues("email"));
      } else {
        localStorage.removeItem("saved_email");
      }

      if (data?.user) {
        login(data.user as IUser);
      }

      router.push(safeRedirect(searchParams.get("redirect"), "/dashboard"));
    },

    onError: (err: {
      message?: string;
      status?: number;
      code?: string;
      data?: {
        next?: string;
        email?: string;
      };
    }) => {
      if (err?.data?.next === "verify-account") {
        showError(err.message || "Please verify your email.");

        router.push(`/verify-account?code=${btoa(err?.data?.email || "")}`);
      } else {
        showError(err.message || "Login failed");
      }
    },
  });

  const handleStandardLogin = (values: LoginFormInput) => {
    loginMutation.mutate(values);
  };

  return (
    <>
      {showOtp ? (
        <LoginWithOtp
          onBack={() => setShowOtp(false)}
          googleRecaptchaEnabled={googleRecaptchaEnabled}
          googleRecaptchaPublicKey={googleRecaptchaPublicKey}
        />
      ) : showLoginLink ? (
        <LoginWithLoginLink onBack={() => setShowLoginLink(false)} />
      ) : (
        <Form
          form={form}
          onSubmit={form.handleSubmit(handleStandardLogin)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email"
                    autoComplete="username webauthn"
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
                  Password <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Enter password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-4 w-4"
                  />
                  <span>Remember Me</span>
                </label>
              )}
            />
            <Link
              href="/password-forgot"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full mt-4">
            {loginMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Login"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowLoginLink(true)}
          >
            Login with Magic Link
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                await authClient.signIn.passkey();
                await refreshSession();
                router.push(
                  safeRedirect(searchParams.get("redirect"), "/dashboard"),
                );
              } catch (err: unknown) {
                showError(getErrorMessage(err, "Passkey sign-in failed"));
              }
            }}
          >
            Sign in with a passkey
          </Button>

          {userLoginWithOtp === "1" && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowOtp(true)}
            >
              Login with OTP
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = getGoogleLoginUrl();
            }}
          >
            Sign in with Google
          </Button>
        </Form>
      )}

      <div className="w-full space-y-2 mt-6">
        <p className="text-muted-foreground text-center text-sm">
          New on our platform?{" "}
          <Link
            href="/register"
            className="hover:text-primary underline underline-offset-4"
          >
            Create an account!
          </Link>
        </p>
      </div>
    </>
  );
}
