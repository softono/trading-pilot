"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import SummernoteEditor, {
  type SummernoteEditorRef,
} from "@/components/ui/summernote-editor";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import PageHeader from "@/components/admin/PageHeader";
import { showError, showSuccess } from "@/lib/message";
import { Loader2 } from "lucide-react";
import { applyServerErrors } from "@/lib/formErrors";
import {
  emailTemplateFormSchema,
  type EmailTemplateFormInput,
} from "@/modules/admin/email-template/email-template.validator";

export default function EmailTemplateUpdate() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef<SummernoteEditorRef>(null);
  const queryClient = useQueryClient();

  const form = useForm<EmailTemplateFormInput>({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: { title: "", subject: "", body: "" },
    mode: "onSubmit",
  });

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["email_template_edit", id],
    queryFn: () =>
      httpRequest<ApiResult>("get", `/admin/email-template/${id!}`),
    enabled: !!id,
  });

  const template = response?.data;

  useEffect(() => {
    if (template) {
      form.reset({
        title: template.title || template.key || "",
        subject: template.subject || "",
        body: template.body || "",
      });
    }
  }, [template, form]);

  const handleSubmit = async (values: {
    title: string;
    subject: string;
    body: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await httpRequest<ApiResult>(
        "patch",
        `/admin/email-template/${id!}`,
        values,
      );
      if (response?.status === 1) {
        showSuccess(response.message || "Email template updated successfully");
        // Invalidate query to refresh template cache
        queryClient.invalidateQueries({ queryKey: ["email_template"] });
        queryClient.invalidateQueries({ queryKey: ["email_template", id] });
        router.push("/admin/email-templates");
      } else {
        showError(response.message || "Failed to update email template");
      }
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const errors = (e?.data as Record<string, unknown>)?.errors as
        | Record<string, string>
        | undefined;
      if (errors) applyServerErrors(form.setError, errors);
      showError(
        err instanceof Error ? err.message : "Failed to update email template",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Error" backUrl="/admin/email-templates" />
        <Card className="border-red-200 bg-red-50 mt-4">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error instanceof Error
                ? error.message
                : "Failed to load email template"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Update Email Template"
        backUrl="/admin/email-templates"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Email Template Information ({template?.title || template?.key})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-sm font-semibold">
                    Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Template Title" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field, fieldState }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-sm font-semibold">
                    Subject <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Email Subject" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field, fieldState }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-sm font-semibold">
                    Body <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <SummernoteEditor
                      ref={editorRef}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter email body (HTML supported)..."
                      height={300}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <div className="flex gap-2 mt-6">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Update Template"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/email-templates")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
