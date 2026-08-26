"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  applicationFormSchema,
  type ApplicationFormInput,
} from "@/modules/analyst/analyst.validator";
import { APPLICATION_STATUS_LABEL } from "@/modules/analyst/analyst.constants";
import type { AnalystApplication } from "@/modules/analyst/analyst.types";
import { Badge } from "@/components/ui/badge";

export default function AnalystApplyPage() {
  const [submitting, setSubmitting] = useState(false);
  const [specialtiesInput, setSpecialtiesInput] = useState("");
  const [experienceYearsInput, setExperienceYearsInput] = useState("");

  const {
    data: appRes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-analyst-application"],
    queryFn: () =>
      httpRequest<ApiResult<AnalystApplication>>("get", "analyst/apply"),
    retry: false,
  });

  const application = appRes?.status === 1 ? appRes.data : null;

  const form = useForm<ApplicationFormInput>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      pitch: "",
      website: "",
    },
  });

  const onSubmit = async (values: ApplicationFormInput) => {
    try {
      setSubmitting(true);
      const specialties = specialtiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await httpRequest<ApiResult>("post", "analyst/apply", {
        ...values,
        specialties,
        experience_years: experienceYearsInput
          ? Number(experienceYearsInput)
          : undefined,
      });

      if (res?.status === 1) {
        showSuccess(res.message || "Application submitted");
        refetch();
      } else {
        showError(res.message || "Failed to submit application");
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

  if (application) {
    const statusEntry =
      APPLICATION_STATUS_LABEL[application.status] ??
      APPLICATION_STATUS_LABEL.pending;

    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your Analyst Application
            <Badge variant={statusEntry.variant}>{statusEntry.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="whitespace-pre-wrap">{application.pitch}</p>
          {application.status === "rejected" &&
            application.rejection_reason && (
              <p className="text-destructive">
                Reason: {application.rejection_reason}
              </p>
            )}
          {application.status === "approved" && (
            <p className="text-success">
              You are now an analyst — visit your analyst profile to get
              started.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Apply to Become an Analyst</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="pitch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Why should we approve you?{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your trading experience and approach..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 5"
                  value={experienceYearsInput}
                  onChange={(e) => setExperienceYearsInput(e.target.value)}
                />
              </FormControl>
            </FormItem>

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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website / Social Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={submitting} className="mt-4">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
