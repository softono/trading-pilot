"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import RecaptchaWidget from "@/components/common/recaptcha";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";

import {
  contactFormSchema,
  type ContactFormInput,
} from "@/modules/public/contactMessage.validator";
import { applyServerErrors } from "@/lib/formErrors";

interface ContactProps {
  googleRecaptchaEnabled: string;
  googleRecaptchaPublicKey: string;
}

export default function Contact({
  googleRecaptchaEnabled,
  googleRecaptchaPublicKey,
}: ContactProps) {
  const form = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
    mode: "onSubmit",
  });

  const [recaptchaToken, setRecaptchaToken] = useState("");

  const onSubmit = async (data: ContactFormInput) => {
    try {
      if (googleRecaptchaEnabled && !recaptchaToken) {
        showError("Please complete the CAPTCHA!");
        return;
      }

      const payload = {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        ...(googleRecaptchaEnabled ? { captcha_token: recaptchaToken } : {}),
      };

      const response = await httpRequest<ApiResult>("post", "contact", payload);

      if (response?.status === 1) {
        showSuccess(response.message || "Message sent successfully");
        form.reset();
        setRecaptchaToken("");
      } else if (response?.http_status === 409) {
        showError(response.message || "Duplicate submission detected");
      } else {
        showError(response?.message || "Something went wrong");
      }
    } catch (error: unknown) {
      const err = error as {
        data?: { errors?: Record<string, string> };
        message?: string;
      };
      if (err?.data?.errors) applyServerErrors(form.setError, err.data.errors);
      showError(err?.message || "Server error, please try again");
    }
  };

  return (
    <>
      <div className="w-full sm:px-6 lg:px-10 py-8 ">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight pb-4 ">
          Contact
        </h1>
        <div className="w-full  p-4 sm:p-6 md:p-8 mt-4 sm:mt-6 rounded-lg shadow bg-card border border-border">
          <Form
            form={form}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Name"
                      {...field}
                      suppressHydrationWarning
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
                      placeholder="Email"
                      {...field}
                      suppressHydrationWarning
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subject <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Subject"
                      {...field}
                      suppressHydrationWarning
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Message <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Message"
                      {...field}
                      suppressHydrationWarning
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

            <Button type="submit" suppressHydrationWarning>
              Submit
            </Button>
          </Form>
        </div>
      </div>
    </>
  );
}
