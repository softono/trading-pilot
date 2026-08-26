import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { applyServerErrors } from "@/lib/formErrors";
import {
  pageFormSchema,
  type PageFormInput,
} from "@/modules/page/page.validator";
import { USER_STATUS } from "@/modules/account/user.constants";
import { USER_STATUS_LABEL } from "@/modules/account/user.constants";

interface PageFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: () => void;
  onError?: () => void;
}

function PageForm({ isEdit, id, onSuccess, onError }: PageFormProps) {
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef<SummernoteEditorRef>(null);
  const form = useForm<PageFormInput>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: { title: "", slug: "", body: "", status: "active" },
    mode: "onSubmit",
    shouldUnregister: false,
  });

  const fetchPage = async (pageId: string) => {
    setLoading(true);
    try {
      const response = await httpRequest<ApiResult>(
        "get",
        `/admin/page/${pageId}`,
      );
      const page = response.data;
      if (page)
        form.reset({
          title: page.title,
          slug: page.slug,
          body: page.body,
          status: page.status,
        });
    } catch {
      showError("Failed to load page");
      if (onError) onError();
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect -- fetch on mount sets loading state */
  useEffect(() => {
    if (isEdit && id) {
      fetchPage(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (values: {
    title: string;
    slug: string;
    body: string;
    status?: string;
  }) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        const response = await httpRequest<ApiResult>(
          "patch",
          `/admin/page/${id}`,
          values,
        );
        if (response?.status === 1) {
          showSuccess(response.message || "Page updated successfully");
          onSuccess();
        } else {
          showError(response.message || "Failed to update page");
        }
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errors = (err?.data as Record<string, unknown>)?.errors as
        | Record<string, string>
        | undefined;
      if (errors) applyServerErrors(form.setError, errors);
      showError("Failed to update page");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Form form={form} onSubmit={form.handleSubmit(handleSubmit)}>
      <FormField
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <FormItem className="mb-4">
            <FormLabel>
              Title <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Page title" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <FormItem className="mb-4">
              <FormLabel>
                Slug <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="page-slug" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />{" "}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={field.value || "active"}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value={USER_STATUS.ACTIVE}>
                    {USER_STATUS_LABEL.active.label}
                  </option>
                  <option value={USER_STATUS.INACTIVE}>
                    {USER_STATUS_LABEL.inactive.label}
                  </option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="body"
        render={({ field, fieldState }) => (
          <FormItem className="mb-4">
            <FormLabel>
              Body <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <SummernoteEditor
                ref={editorRef}
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter page body content..."
                height={300}
              />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
            <div className="text-sm text-muted-foreground mt-1">
              <strong>Available parameters:</strong> subject, message, app_name
              <br />
              Use{" "}
              <code className="bg-muted px-1 rounded">
                {"{{parameter_name}}"}
              </code>{" "}
              syntax (e.g., {"{{subject}}"}, {"{{message}}"}, {"{{app_name}}"})
            </div>
          </FormItem>
        )}
      />
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Update"}
        </Button>
      </div>
    </Form>
  );
}

export default PageForm;
