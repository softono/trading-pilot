"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/authClient";
import { useAuth } from "@/context/AdminAuthContext";
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
import { showError, showSuccess } from "@/lib/message";
import { safeRedirect } from "@/utils/safeRedirect";
import {
  adminLoginFormSchema,
  type AdminLoginFormInput,
} from "@/server/modules/auth/login.validator";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(
        safeRedirect(searchParams.get("redirect"), "/admin/dashboard"),
      );
    }
  }, [isAuthenticated, loading, router, searchParams]);

  const form = useForm<AdminLoginFormInput>({
    resolver: zodResolver(adminLoginFormSchema),
    defaultValues: { email: "", password: "", remember: false },
    mode: "onSubmit",
  });

  const loginMutation = useMutation({
    mutationFn: async (values: AdminLoginFormInput) => {
      const result = await authClient.signIn.adminEmail({
        email: values.email,
        password: values.password,
        remember: values.remember,
      });
      return result.data;
    },
    onSuccess: (data) => {
      if ((data as Record<string, unknown>)?.next === "tfa") {
        const sp = new URLSearchParams({ type: "tfa" });
        const redirect = searchParams.get("redirect");
        if (redirect) sp.set("redirect", redirect);
        router.push(`/admin/auth/verify?${sp.toString()}`);
        return;
      }
      if (data?.user) {
        showSuccess("Login successful");
        login(data.user as Parameters<typeof login>[0]);
      }
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

        router.push(
          `/admin/auth/verify-account?code=${btoa(err?.data?.email || "")}`,
        );
      } else {
        showError(err.message || "Login failed");
      }
    },
  });

  const handleStandardLogin = (values: AdminLoginFormInput) => {
    if (values.remember) {
      localStorage.setItem("saved_email", values.email);
    } else {
      localStorage.removeItem("saved_email");
    }
    loginMutation.mutate(values);
  };

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(handleStandardLogin)}
      className="space-y-4"
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
              <Input placeholder="Enter email" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              Password <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="Enter password"
                aria-invalid={!!fieldState.error}
                {...field}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between">
        <FormField
          control={form.control}
          name="remember"
          render={({ field, fieldState }) => (
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="h-4 w-4"
                aria-invalid={!!fieldState.error}
              />
              <span>Remember Me</span>
            </label>
          )}
        />
        <Link
          href="/admin/auth/password_forgot"
          className="text-sm text-primary hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" className="w-full">
        {loginMutation.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          "Login"
        )}
      </Button>
    </Form>
  );
}
