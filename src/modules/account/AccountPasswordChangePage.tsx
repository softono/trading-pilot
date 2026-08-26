"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { showError, showSuccess } from "@/lib/message";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { AccountBlock } from "@/modules/account/AccountBlock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordFormSchema,
  type ChangePasswordFormInput,
} from "@/modules/account/change-password.validator";

export default function ChangePassword() {
  const router = useRouter();
  const form = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const { reset } = form;

  const [show, setShow] = useState({
    current: false,
    password: false,
    confirm: false,
  });

  const onSubmit = async (data: ChangePasswordFormInput) => {
    try {
      await authClient.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });

      showSuccess("Password changed successfully. Please log in again.");
      router.push("/login");
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Something went wrong"));
    }
  };

  return (
    <>
      <AccountBlock activeTab="Password Change" />
      <div className="flex-1 sm:px-10 mt-6 sm:mt-9">
        <Card className="mb-6 w-full p-0">
          <div className="p-8 pb-4 border-b">
            <h2 className="text-lg font-semibold mb-6 text-foreground">
              Change Password
            </h2>

            <Form
              form={form}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Current Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show.current ? "text" : "password"}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                            onClick={() =>
                              setShow({ ...show, current: !show.current })
                            }
                            suppressHydrationWarning
                          >
                            {show.current ? (
                              <Eye size={18} />
                            ) : (
                              <EyeOff size={18} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="hidden md:block"></div>

                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        New Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show.password ? "text" : "password"}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                            onClick={() =>
                              setShow({ ...show, password: !show.password })
                            }
                            suppressHydrationWarning
                          >
                            {show.password ? (
                              <Eye size={18} />
                            ) : (
                              <EyeOff size={18} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm New Password{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={show.confirm ? "text" : "password"}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                            onClick={() =>
                              setShow({ ...show, confirm: !show.confirm })
                            }
                            suppressHydrationWarning
                          >
                            {show.confirm ? (
                              <Eye size={18} />
                            ) : (
                              <EyeOff size={18} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">
                  Password Requirements:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  <li>Password must be at least 6 characters long.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => reset()}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </Card>
      </div>
    </>
  );
}
