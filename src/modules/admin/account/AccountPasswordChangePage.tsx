"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { showError, showSuccess } from "@/lib/message";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/httpClient";
import { AccountBlock } from "@/modules/account/AccountBlock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  changePasswordFormSchema,
  type ChangePasswordFormInput,
} from "@/modules/account/change-password.validator";

export default function AdminAccountPasswordChangePage() {
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

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
      router.push("/admin/auth/login");
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Something went wrong"));
    }
  };

  return (
    <>
      <AccountBlock basePath="/admin" />
      <div className="flex-1 sm:px-6 md:px-10 mt-6 sm:mt-9">
        <div className="bg-card rounded-2xl border shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-6 text-foreground">
            Change Password
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={show.current ? "text" : "password"}
                    {...register("current_password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShow({ ...show, current: !show.current })}
                  >
                    {show.current ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <p className="text-destructive text-sm mt-1">
                  {errors.current_password?.message}
                </p>
              </div>

              {/* Spacer */}
              <div className="hidden md:block"></div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={show.password ? "text" : "password"}
                    {...register("new_password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() =>
                      setShow({ ...show, password: !show.password })
                    }
                  >
                    {show.password ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <p className="text-destructive text-sm mt-1">
                  {errors.new_password?.message}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={show.confirm ? "text" : "password"}
                    {...register("confirm_password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShow({ ...show, confirm: !show.confirm })}
                  >
                    {show.confirm ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <p className="text-destructive text-sm mt-1">
                  {errors.confirm_password?.message}
                </p>
              </div>
            </div>

            {/* Password Rules */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Password Requirements:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Password must be at least 6 characters long.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
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
          </form>
        </div>
      </div>
    </>
  );
}
