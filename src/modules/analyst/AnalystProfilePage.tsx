"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { applyServerErrors } from "@/lib/formErrors";
import {
  analystProfileFormSchema,
  type AnalystProfileFormInput,
} from "@/modules/analyst/analyst.validator";
import type { AnalystProfile } from "@/modules/analyst/analyst.types";

export default function AnalystProfilePage() {
  const [submitting, setSubmitting] = useState(false);
  const [specialtiesInput, setSpecialtiesInput] = useState("");

  const {
    data: profileRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-analyst-profile"],
    queryFn: () =>
      httpRequest<ApiResult<AnalystProfile>>("get", "analyst/profile"),
    retry: false,
  });
  const profile = profileRes?.status === 1 ? profileRes.data : null;

  const form = useForm<AnalystProfileFormInput>({
    resolver: zodResolver(analystProfileFormSchema),
    defaultValues: {
      display_name: "",
      headline: "",
      bio: "",
      is_public: true,
    },
  });

  /* eslint-disable react-hooks/set-state-in-effect -- populating form from fetched profile */
  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name,
        headline: profile.headline || "",
        bio: profile.bio || "",
        is_public: profile.is_public,
      });
      setSpecialtiesInput((profile.specialties || []).join(", "));
    }
  }, [profile, form]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: AnalystProfileFormInput) => {
    try {
      setSubmitting(true);
      const specialties = specialtiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await httpRequest<ApiResult>("patch", "analyst/profile", {
        ...values,
        specialties,
      });

      if (res?.status === 1) {
        showSuccess(res.message || "Profile updated");
      } else {
        showError(res.message || "Failed to update profile");
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errors = (err?.data as Record<string, unknown>)?.errors as
        | Record<string, string>
        | undefined;
      if (errors) applyServerErrors(form.setError, errors);
      else showError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return <p className="text-destructive">Failed to load your profile.</p>;
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Analyst Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Display Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Your public name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Swing trader, 8 years NSE"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Specialties</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Swing trading, Options, Breakouts"
                  value={specialtiesInput}
                  onChange={(e) => setSpecialtiesInput(e.target.value)}
                />
              </FormControl>
              <FormDescription>Comma-separated</FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Public Profile</FormLabel>
                    <FormDescription>
                      Show this profile on the public analysts page
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={submitting} className="mt-4">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
