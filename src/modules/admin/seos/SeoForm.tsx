import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { currentTime } from "@/lib/date";
import {
  seoMetaFormSchema,
  type SeoMetaFormInput,
} from "@/modules/admin/seos/seo.validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { Loader2 } from "lucide-react";
import { applyServerErrors } from "@/lib/formErrors";

interface SeoMetaFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: () => void;
  onError?: () => void;
}

const SeoMetaForm = forwardRef<
  { refetchSeoMeta: () => void },
  SeoMetaFormProps
>(({ isEdit, id, onSuccess }, ref) => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const form = useForm<SeoMetaFormInput>({
    resolver: zodResolver(seoMetaFormSchema),
    defaultValues: {
      url: "",
      title: "",
      keyword: "",
      description: "",
      last_modified: currentTime("yyyy-MM-dd'T'HH:mm"),
      change_frequency: "weekly",
      priority: 1,
      sitemap_enable: 1,
    },
    mode: "onSubmit",
  });

  const sitemapEnabled = form.watch("sitemap_enable");

  useEffect(() => {
    if (isEdit && id) {
      fetchSeoMeta(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const fetchSeoMeta = async (seoMetaId: string) => {
    try {
      setLoading(true);
      const response = await httpRequest<ApiResult>(
        "get",
        `admin/seos/${seoMetaId}`,
      );
      const seoMeta = response.data;

      form.reset({
        url: seoMeta?.url ?? "",
        title: seoMeta?.title ?? "",
        keyword: seoMeta?.keyword ?? "",
        description: seoMeta?.description ?? "",
        last_modified: seoMeta?.last_modified ?? "",
        change_frequency: seoMeta?.change_frequency ?? "weekly",
        priority: seoMeta?.priority ?? 1,
        sitemap_enable: seoMeta?.sitemap_enable ?? 1,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load SEO meta data";
      console.error("Error fetching SEO meta:", message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refetchSeoMeta: () => {
      if (id) {
        fetchSeoMeta(id);
      }
    },
  }));

  const onSubmit = async (values: SeoMetaFormInput) => {
    try {
      setSubmitting(true);

      let response;
      if (isEdit && id) {
        response = await httpRequest<ApiResult>(
          "patch",
          `admin/seos/${id}`,
          values,
        );
      } else {
        response = await httpRequest<ApiResult>("post", "admin/seos", values);
      }

      if (response?.status === 1) {
        showSuccess(
          response.message ||
            `SEO Meta ${isEdit ? "updated" : "created"} successfully`,
        );
        onSuccess();
      } else {
        showError(
          response.message ||
            `Failed to ${isEdit ? "update" : "create"} SEO meta`,
        );
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errors = (err?.data as Record<string, unknown>)?.errors as
        | Record<string, string>
        | undefined;
      if (errors) applyServerErrors(form.setError, errors);
      const resp = err?.response as Record<string, unknown> | undefined;
      const respData = resp?.data as Record<string, unknown> | undefined;
      const errorMessage =
        (respData?.message as string) ||
        (error instanceof Error ? error.message : undefined) ||
        `Failed to ${isEdit ? "update" : "create"} SEO meta`;
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  URL <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., /home" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Page title" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="keyword"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Keywords</FormLabel>
              <FormControl>
                <Input
                  placeholder="SEO keywords (comma separated)"
                  {...field}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Meta description for search engines"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      </div>

      {/* Sitemap Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b pb-2">
          Sitemap Settings
        </h3>

        <FormField
          control={form.control}
          name="sitemap_enable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sitemap Enable</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">Enabled</SelectItem>
                  <SelectItem value="0">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div
          className={`space-y-4 mt-4 p-4 bg-muted rounded-lg border transition-all duration-200 ${sitemapEnabled === 1 ? "opacity-100" : "hidden"}`}
        >
          <h4 className="text-md font-medium text-muted-foreground">
            Sitemap Configuration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Priority{" "}
                    {sitemapEnabled === 1 && (
                      <span className="text-red-500">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      placeholder="0.5"
                      disabled={sitemapEnabled !== 1}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_modified"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Last Modified</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={sitemapEnabled !== 1}
                      {...field}
                      value={field.value || currentTime("yyyy-MM-dd'T'HH:mm")}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="change_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={sitemapEnabled !== 1}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Select Frequency">
                        Select Frequency
                      </SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={submitting} className="px-8">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Update SEO Meta"
          ) : (
            "Create SEO Meta"
          )}
        </Button>
      </div>
    </Form>
  );
});

SeoMetaForm.displayName = "SeoMetaForm";

export default SeoMetaForm;
