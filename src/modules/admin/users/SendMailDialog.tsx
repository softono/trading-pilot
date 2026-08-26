import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { showError, showSuccess } from "@/lib/message";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import {
  userMailFormSchema,
  type UserMailFormInput,
} from "@/modules/account/user.validator";
import { applyServerErrors } from "@/lib/formErrors";

interface SendMailDialogProps {
  userEmail: string;
  children: React.ReactNode;
}

export function SendMailDialog({ userEmail, children }: SendMailDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserMailFormInput>({
    resolver: zodResolver(userMailFormSchema),
    defaultValues: { subject: "", message: "" },
  });

  const onSubmit = async (values: UserMailFormInput) => {
    setIsSubmitting(true);
    try {
      const data = await httpRequest<ApiResult>("patch", "admin/users/mail", {
        to_user: userEmail,
        subject: values.subject,
        message: values.message,
      });

      if (data?.status === 1) {
        showSuccess(data.message || "Mail sent successfully");
        form.reset();
        setOpen(false);
      } else {
        showError(data.message || "Failed to send mail");
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errors = (err?.data as Record<string, unknown>)?.errors as
        | Record<string, string>
        | undefined;
      if (errors) applyServerErrors(form.setError, errors);
      showError(error instanceof Error ? error.message : "Failed to send mail");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>Send Mail to User</DialogTitle>
          <DialogDescription>Send an email to {userEmail}</DialogDescription>
        </DialogHeader>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email subject"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your message"
                    {...field}
                    disabled={isSubmitting}
                    rows={6}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Mail"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
