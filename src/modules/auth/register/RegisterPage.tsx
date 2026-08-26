"use client";

import { useEffect, useRef, useState } from "react";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getIpInfo } from "@/utils/ipinfo";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient, getGoogleLoginUrl } from "@/lib/authClient";
import {
  registerFormSchema,
  type RegisterFormInput,
} from "./register.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { showError, showSuccess } from "@/lib/message";
import { useAuth, type IUser } from "@/context/AuthContext";
import RecaptchaWidget from "@/components/common/recaptcha";

interface RegisterProps {
  googleRecaptchaEnabled: string;
  googleRecaptchaPublicKey: string;
}

export default function Register({
  googleRecaptchaEnabled,
  googleRecaptchaPublicKey,
}: RegisterProps) {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();

  const countryRef = useRef("");
  const [recaptchaToken, setRecaptchaToken] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    getIpInfo().then((info) => {
      if (info?.country) countryRef.current = info.country;
    });
  }, []);

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
      confirm_password: "",
      agree: false,
    },
    mode: "onChange",
  });

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormInput) => {
      if (googleRecaptchaEnabled === "1" && !recaptchaToken) {
        throw { message: "Please complete the CAPTCHA!" };
      }

      const res = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        recaptcha_token: recaptchaToken,
        country: countryRef.current || undefined,
      });

      return res.data;
    },

    onSuccess: (
      data: { next?: string; email?: string; user?: IUser } | null | undefined,
    ) => {
      if (data?.next === "verify-account") {
        showSuccess("Registration successful. Please verify your email.");

        router.push(`/verify-account?code=${btoa(data.email || "")}`);
      } else {
        showSuccess("Registration successful.");

        if (data?.user) {
          login(data.user);
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      }
    },

    onError: (err: { message?: string; code?: string }) => {
      if (err.code === "USER_ALREADY_EXISTS") {
        form.setError("email", { message: "Email already in use" });
      }
      showError(err.message || "Registration failed");
    },
  });

  const onSubmit = (values: RegisterFormInput) => {
    registerMutation.mutate(values);
  };

  return (
    <>
      <Form
        form={form}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                First Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter your first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Last Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  type="email"
                  placeholder="Enter your email address"
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
                <PasswordInput placeholder="Create a password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Confirm Password <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Re-enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agree"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <FormLabel className="text-sm">
                  I agree to{" "}
                  <a
                    href="/page/privacy-policy"
                    target="_blank"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Privacy Policy & Terms
                  </a>
                </FormLabel>
              </div>
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

        <Button type="submit" className="w-full">
          {registerMutation.isPending ? "Registering..." : "Register"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = getGoogleLoginUrl();
          }}
        >
          Register with Google
        </Button>
      </Form>

      <div className="w-full space-y-2 mt-6">
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="hover:text-primary underline underline-offset-4"
          >
            Log in instead
          </Link>
        </p>
      </div>
    </>
  );
}
