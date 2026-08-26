"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AccountBlock } from "@/modules/account/AccountBlock";
import {
  ProfileImageUpload,
  userProfileImageRequests,
} from "@/modules/account/ProfileImageUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/lib/message";
import { httpRequest, getErrorMessage } from "@/lib/httpClient";
import type { ApiResponse } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  accountUpdateFormSchema,
  type AccountUpdateFormInput,
} from "@/modules/account/update.validator";
import { applyServerErrors } from "@/lib/formErrors";
import { authClient } from "@/lib/authClient";
import { EmailChangeCard } from "@/modules/account/EmailChangeCard";

export default function Update() {
  const { user, updateUser, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setProfileImage] = useState<File | null>(null);
  const router = useRouter();

  const form = useForm<AccountUpdateFormInput>({
    resolver: zodResolver(accountUpdateFormSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
    },
  });

  const { control, reset } = form;

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const handleImageChange = (file: File | null) => {
    setProfileImage(file);
  };

  const onSubmit = async (data: AccountUpdateFormInput) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const payload = {
        userId: user.id,
        ...data,
      };

      const resp = await httpRequest<ApiResponse>(
        "put",
        "account/update",
        payload,
      );

      if (resp.status === 1) {
        updateUser({ ...user, ...data });

        showSuccess("Profile updated successfully!");
      } else {
        showError(resp.message || "An error occurred while updating profile");
      }
    } catch (error: unknown) {
      const err = error as {
        data?: { errors?: Record<string, string> };
        message?: string;
      };
      if (err?.data?.errors) applyServerErrors(form.setError, err.data.errors);
      showError(err?.message || "An error occurred while updating profile");
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
      await authClient.deleteUser();

      showSuccess("Account deactivated successfully");
      logout();
      router.push("/");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Server error, please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <>
        <AccountBlock activeTab="Account" />
        <div className="flex-1 sm:px-10 mt-6 sm:mt-9">
          <Card className="mb-6 w-full p-0">
            <div className="p-8 pb-4 border-b">
              <ProfileImageUpload
                user={user}
                updateUser={updateUser}
                {...userProfileImageRequests()}
                currentImage={user?.image ?? undefined}
                onChange={handleImageChange}
              />
            </div>

            <div className="p-8 pt-4">
              <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Last Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                          />
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
                          <Input
                            type="tel"
                            placeholder="Enter your phone number"
                            {...field}
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

          <EmailChangeCard />

          <Card className="p-6">
            <h5 className="text-lg font-semibold mb-4">Delete Account</h5>

            <div className="bg-muted p-4 rounded mb-6">
              <h5 className="mb-1">
                Are you sure you want to delete your account?
              </h5>
              <p className="text-sm mb-3">
                {" "}
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
    </ProtectedRoute>
  );
}
