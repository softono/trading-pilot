"use client";
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import Image from "next/image";
import { useAuth } from "@/context/AdminAuthContext";
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
import { type ApiResult } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import countries from "@/modules/account/countries.constants";
import { showError, showSuccess } from "@/lib/message";
import { Loader2 } from "lucide-react";
import {
  adminFormSchema,
  type AdminFormInput,
} from "@/server/modules/admin/admin/save.validator";
import { applyServerErrors } from "@/lib/formErrors";

interface AdminFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: (data?: unknown) => void;
  onError?: () => void;
}

export interface AdminFormHandle {
  refetchAdmin: () => void;
}

const AdminForm = forwardRef<AdminFormHandle, AdminFormProps>(
  ({ isEdit, id, onSuccess }, ref) => {
    const { user, updateUser } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const [loading, setLoading] = useState(false);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const form = useForm<AdminFormInput>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(adminFormSchema(isEdit)) as any,
      defaultValues: {
        first_name: "",
        last_name: "",
        password: "",
        email: "",
        phone: "",
        country: "",
        status: "active",
        two_factor_enabled: false,
        image: null as File | null,
      },
      mode: "onSubmit",
    });

    const fetchAdmin = async (adminId: string) => {
      try {
        setLoading(true);
        const response = await httpRequest<ApiResult>(
          "get",
          `/admin/admins/${adminId}`,
        );
        const admin = response.data;

        form.reset({
          first_name: admin?.first_name ?? "",
          last_name: admin?.last_name ?? "",
          email: admin?.email ?? "",
          phone: admin?.phone ?? "",
          country: admin?.country ?? "",
          status: admin?.status ?? "active",
          two_factor_enabled: admin?.two_factor_enabled ?? false,
          password: "",
          image: null,
        });

        if (admin?.image) {
          setExistingImage(admin.image);
        }
      } catch {
        showError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refetchAdmin: () => {
        if (id) fetchAdmin(id);
      },
    }));

    useEffect(() => {
      if (!isEdit || !id) return;
      fetchAdmin(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEdit]);

    const onSubmit = async (values: AdminFormInput) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        setSubmitting(true);

        const formData = new FormData();
        formData.append("first_name", values.first_name);
        formData.append("last_name", values.last_name);
        formData.append("email", values.email);
        formData.append("phone", values.phone || "");
        formData.append("country", values.country || "");
        formData.append("status", values.status ?? "active");
        formData.append("role", "ADMIN");
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

        const response =
          isEdit && id
            ? await httpRequest<ApiResult>(
                "patch",
                `/admin/admins/${id}`,
                formData,
              )
            : await httpRequest<ApiResult>("post", "admin/admins", formData);

        if (response?.status === 1) {
          showSuccess(
            response.message ||
              `Admin ${isEdit ? "updated" : "created"} successfully`,
          );
          if (isEdit && id && user && user.id?.toString() === id?.toString()) {
            updateUser({
              ...user,
              first_name: values.first_name,
              last_name: values.last_name,
              email: values.email,
              phone: values.phone,
              country: values.country,
            });
          }
          onSuccess(isEdit ? id : response.data);
        } else {
          showError(
            response.message ||
              `Failed to ${isEdit ? "update" : "create"} Admin`,
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
          `Failed to ${isEdit ? "update" : "create"} Admin`;
        showError(errorMessage);
      } finally {
        isSubmittingRef.current = false;
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
                    placeholder="Password"
                    {...field}
                    readOnly={isEdit}
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
                  onValueChange={field.onChange}
                  value={String(field.value)}
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Image</FormLabel>

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
                      field.onChange(file);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImagePreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </FormControl>

              <p className="text-xs text-muted mt-2">
                Optional. Images are sent as base64.
              </p>

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
              "Update Admin"
            ) : (
              "Create Admin"
            )}
          </Button>
        </div>
      </Form>
    );
  },
);

AdminForm.displayName = "AdminForm";

export default AdminForm;
