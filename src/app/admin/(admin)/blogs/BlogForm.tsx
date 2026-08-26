"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

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
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import SummernoteEditor from "@/components/ui/summernote-editor";

import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { applyServerErrors } from "@/lib/formErrors";
import { USER_STATUS } from "@/modules/account/user.constants";
import { BLOG_CATEGORIES } from "@/modules/blog/blog.constants";
import {
  blogFormSchema,
  type BlogFormInput,
} from "@/modules/blog/blog.validator";

interface BlogFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: () => void;
  onError?: () => void;
}

export default function BlogForm({
  isEdit,
  id,
  onSuccess,
  onError,
}: BlogFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const form = useForm<BlogFormInput>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      body: "",
      category: "",
      image: null,
      meta_title: "",
      meta_description: "",
      status: USER_STATUS.ACTIVE,
    },
  });

  /* ---------------- LOAD EDIT ---------------- */
  const {
    data: blogResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin_blog_edit", id],
    queryFn: () => httpRequest<ApiResult>("get", `/admin/blogs/${id}`),
    enabled: isEdit && !!id,
  });
  const blog = blogResponse?.data;

  /* eslint-disable react-hooks/set-state-in-effect -- populating form from fetched blog data */
  useEffect(() => {
    if (blog) {
      form.reset({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        body: blog.body,
        category: blog.category,
        image: null,
        meta_title: blog.meta_title || "",
        meta_description: blog.meta_description || "",
        status: blog.status ?? USER_STATUS.ACTIVE,
      });
      setExistingImage(blog.image || null);
      setImagePreview(null);
    }
  }, [blog, form]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isError) {
      showError("Failed to load blog data");
      onError?.();
    }
  }, [isError, onError]);

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (values: BlogFormInput) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("slug", values.slug);
      formData.append("excerpt", values.excerpt);
      formData.append("body", values.body);
      formData.append("category", values.category);
      formData.append("status", values.status);
      formData.append("meta_title", values.meta_title || "");
      formData.append("meta_description", values.meta_description || "");
      if (values.image instanceof File) {
        formData.append("image", values.image);
      }

      const res = isEdit
        ? await httpRequest<ApiResult>("patch", `/admin/blogs/${id}`, formData)
        : await httpRequest<ApiResult>("post", "/admin/blogs", formData);

      if (res?.status === 1) {
        showSuccess(res.message || "Blog saved successfully");
        onSuccess();
      } else {
        showError(res.message || "Failed to save blog");
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

  if (isEdit && isLoading) return <div>Loading...</div>;

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* TITLE */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter blog title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SLUG */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Slug <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. my-first-blog-post" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* EXCERPT */}
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Excerpt <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="Short blog summary..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* BODY */}
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Content <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <SummernoteEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write blog content here..."
                  height={350}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CATEGORY */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Category <span className="text-destructive">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BLOG_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* IMAGE */}
        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange } }) => (
            <FormItem>
              <FormLabel>Featured Image</FormLabel>

              {/* Image Preview */}
              <div className="mb-4">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="w-24 h-24 object-cover rounded border"
                    unoptimized
                  />
                ) : existingImage ? (
                  <Image
                    src={existingImage}
                    alt="Current Profile"
                    width={96}
                    height={96}
                    className="w-24 h-24 object-cover rounded border"
                    unoptimized
                  />
                ) : (
                  <div className="w-24 h-24 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onChange(file);

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImagePreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* META TITLE */}
        <FormField
          control={form.control}
          name="meta_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Title</FormLabel>
              <FormControl>
                <Input placeholder="SEO title (optional)" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* META DESCRIPTION */}
        <FormField
          control={form.control}
          name="meta_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description</FormLabel>
              <FormControl>
                <Textarea placeholder="SEO description (optional)" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* STATUS */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={USER_STATUS.ACTIVE}>Active</SelectItem>
                  <SelectItem value={USER_STATUS.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex justify-end gap-3">
        {/* SUBMIT */}
        <Button type="submit" className="mt-4" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Update Blog" : "Create Blog"}
        </Button>
      </div>
    </Form>
  );
}
