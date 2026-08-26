"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchSelect } from "@/components/ui/search-select";
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

const USERS_QUERY_KEY = ["user"] as const;
import { zodResolver } from "@hookform/resolvers/zod";
import countries from "@/modules/account/countries.constants";
import { showError, showSuccess } from "@/lib/message";
import { Loader2 } from "lucide-react";
import {
  userFormSchema,
  type UserFormInput,
} from "@/modules/account/user.validator";
import { applyServerErrors } from "@/lib/formErrors";

interface UserFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: (data?: unknown) => void;
}

export default function UserForm({ isEdit, id, onSuccess }: UserFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const {
    data: response,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => httpRequest<ApiResult>("get", `/admin/users/${id!}`),
    enabled: !!id,
  });

  const user = response?.data;

  useEffect(() => {
    if (error) {
      showError(error.message || "Failed to load user data");
    }
  }, [error]);

  const form = useForm<UserFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(userFormSchema(isEdit)) as any,
    defaultValues: {
      first_name: "",
      last_name: "",
      password: "",
      email: "",
      phone: "",
      country: "",
      status: "active",
      image: null as File | null,
      two_factor_enabled: false,
    },
    mode: "onSubmit",
  });

  /* eslint-disable react-hooks/set-state-in-effect -- populating form from fetched user data */
  useEffect(() => {
    if (!user) return;
    form.reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      country: user.country ?? "",
      status: user.status ?? "active",
      password: "",
      image: null,
      two_factor_enabled: !!user.two_factor_enabled,
    });
    setExistingImage(user.image || null);
    setImagePreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: UserFormInput) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email);
      formData.append("phone", values.phone || "");
      formData.append("country", values.country || "");
      formData.append("status", values.status ?? "active");
      formData.append("role", "USER");
      formData.append(
        "two_factor_enabled",
        values.two_factor_enabled ? "true" : "false",
      );

      if (values.password) {
        formData.append("password", values.password);
      }

      if (values.image) {
        formData.append("image", values.image);
      }

      const response: ApiResult =
        isEdit && id
          ? await httpRequest<ApiResult>(
              "patch",
              `/admin/users/${id}`,
              formData,
            )
          : await httpRequest<ApiResult>("post", "/admin/users", formData);

      if (response?.status === 1) {
        showSuccess(response.message);
        onSuccess(isEdit ? id : response.data);
      } else {
        showError(response.message);
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
        `Failed to ${isEdit ? "update" : "create"} user`;
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
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                First Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="First name" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Last Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Last name" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Password {!isEdit && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder={
                    isEdit ? "Leave blank to keep unchanged" : "Password"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Email <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Phone number" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <SearchSelect
                  options={countries.map((c) => ({
                    label: c.name,
                    value: c.name,
                  }))}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select country"
                  searchPlaceholder="Search country..."
                  emptyText="No country found."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                value={field.value || "active"}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="two_factor_enabled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2FA Enabled</FormLabel>
              <Select
                value={field.value ? "true" : "false"}
                onValueChange={(v) => field.onChange(v === "true")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="image"
        render={({ field: { onChange } }) => (
          <FormItem>
            <FormLabel>Profile Image</FormLabel>

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
                <div className="w-24 h-24 bg-gray-200 rounded border flex items-center justify-center text-xs  text-muted-foreground">
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
            <p className="text-xs text-muted mt-2">Optional.</p>

            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Update User"
          ) : (
            "Create User"
          )}
        </Button>
      </div>
    </Form>
  );
}
