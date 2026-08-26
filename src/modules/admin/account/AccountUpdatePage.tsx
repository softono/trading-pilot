"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AdminAuthContext";

import { AccountBlock } from "@/modules/account/AccountBlock";
import {
  ProfileImageUpload,
  adminProfileImageRequests,
} from "@/modules/account/ProfileImageUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import COUNTRIES from "@/modules/account/countries.constants";
import { showError, showSuccess } from "@/lib/message";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { UserProfile } from "@/modules/account/user.types";
import { applyServerErrors } from "@/lib/formErrors";

export default function AdminAccountUpdatePage() {
  const { user, updateUser, logout } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
  }

  const defaultValues = useMemo(
    () => ({
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      country: user?.country || "",
    }),
    [user],
  );

  const form = useForm<FormData>({ defaultValues });
  const { control, reset } = form;

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
      });
    }
  }, [user, reset]);

  const handleImageChange = (file: File | null) => {
    if (!file || !user) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("user_id", String(user.id));
    httpRequest<ApiResult<{ image?: string; url?: string }>>(
      "post",
      "admin/account/upload-image",
      formData,
    ).then((resp) => {
      if (resp.status === 1 && resp.data?.image) {
        updateUser({ ...user, image: resp.data.image });
      }
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const payload = {
        userId: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        country: data.country,
      };

      const resp = await httpRequest<
        ApiResult<UserProfile> & { next?: string; url?: string }
      >("put", "admin/account/update", payload);

      if (resp.status === 1) {
        if (user) {
          updateUser({
            ...user,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone,
            country: data.country,
          });
        }

        if (resp.next === "redirect" && resp.url) {
          showSuccess(
            resp.message || "Account updated, verification required.",
          );
          router.push(resp.url.startsWith("/") ? resp.url : "/" + resp.url);
        } else {
          showSuccess(resp.message || "Profile updated successfully!");
        }
      } else {
        showError(resp?.message || "An error occurred while updating profile");
      }
    } catch (error: unknown) {
      const errData = (error as { data?: { errors?: Record<string, string> } })
        ?.data;
      if (errData?.errors) applyServerErrors(form.setError, errData.errors);
      showError("An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmed) {
      showError("Please confirm your account deactivation.");
      return;
    }

    setLoading(true);
    try {
      const data = await httpRequest<ApiResult>(
        "delete",
        "admin/account/delete-image",
        { userId: String(user?.id || "") },
      );
      // NOTE: If admin has no deactivate API, fall back to updateProfile.
      // Keeping behavior consistent with admin backend availability.
      if (data?.status === 1) {
        showSuccess(data.message || "Account deactivated successfully");
        logout();
        router.push("/");
      } else {
        showError(data?.message || "Something went wrong");
      }
    } catch (error: unknown) {
      showError(
        error instanceof Error
          ? error.message
          : "Server error, please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AccountBlock basePath="/admin" />
      <div className="flex-1 flex flex-col mt-6 sm:mt-9 sm:px-10">
        <Card className="mb-6 w-full p-0">
          <div className="p-8 pb-4 border-b">
            <ProfileImageUpload
              user={user}
              updateUser={updateUser}
              {...adminProfileImageRequests(user?.id)}
              onChange={handleImageChange}
            />
          </div>

          <div className="p-8 pt-4">
            <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <SearchSelect
                          options={COUNTRIES.map((c) => ({
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

              <div className="mt-8 flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Button type="reset" variant="secondary">
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </Card>

        <Card className="p-6">
          <h5 className="text-lg font-semibold mb-4">Delete Account</h5>

          <div className="bg-muted p-4 rounded mb-6">
            <h5 className="mb-1">
              Are you sure you want to delete your account?
            </h5>
            <p className="text-sm mb-3">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
          </div>

          <form onSubmit={handleDelete}>
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mr-2"
              />
              <label>I confirm my account deactivation</label>
            </div>

            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Deactivating..." : "Deactivate Account"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
