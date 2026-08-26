"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { showError, showSuccess } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth, type IUser } from "@/context/AuthContext";
import { authClient, type LoginLinkStart } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { safeRedirect } from "@/utils/safeRedirect";
import {
  loginLinkEmailFormSchema,
  type LoginLinkEmailFormInput,
} from "@/modules/auth/login-link/login-link.validator";
import LoginLinkWaiting from "@/modules/auth/login-link/LoginLinkWaiting";

export default function LoginWithLoginLink({
  onBack,
}: {
  onBack?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [link, setLink] = useState<LoginLinkStart | null>(null);
  const [email, setEmail] = useState("");

  const form = useForm<LoginLinkEmailFormInput>({
    resolver: zodResolver(loginLinkEmailFormSchema),
    defaultValues: { email: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (values: LoginLinkEmailFormInput) => {
      const res = await authClient.loginLink.create({
        email: values.email,
        remember: true,
      });
      return res.data as LoginLinkStart;
    },
    onSuccess: (data) => {
      setEmail(form.getValues("email"));
      setLink(data);
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to send login link");
    },
  });

  const handleResend = async (): Promise<LoginLinkStart | null> => {
    try {
      const res = await authClient.loginLink.create({ email, remember: true });
      return res.data as LoginLinkStart;
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to resend login link"));
      return null;
    }
  };

  const handleBack = () => {
    setLink(null);
    form.reset({ email: "" });
    if (onBack) onBack();
    else router.push("/login");
  };

  if (link) {
    return (
      <LoginLinkWaiting
        initial={link}
        onResend={handleResend}
        onCancel={handleBack}
        onSuccess={(user) => {
          showSuccess("Login successful");
          if (user) login(user as IUser);
          router.push(safeRedirect(searchParams.get("redirect"), "/dashboard"));
        }}
      />
    );
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
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
              <Input type="email" placeholder="Enter email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        className="w-full"
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          "Send Magic Link"
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleBack}
      >
        Login with Password
      </Button>
    </Form>
  );
}
