"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import {
  userSettingsFormSchema,
  type UserSettingsFormInput,
} from "@/modules/analyst/analyst.validator";
import type { UserSettings } from "@/modules/analyst/analyst.types";

export default function AnalystSettingsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [allowedIpsInput, setAllowedIpsInput] = useState("");

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ["my-analyst-settings"],
    queryFn: () =>
      httpRequest<ApiResult<UserSettings>>("get", "analyst/settings"),
    retry: false,
  });
  const settings = settingsRes?.data;

  const form = useForm<UserSettingsFormInput>({
    resolver: zodResolver(userSettingsFormSchema),
    defaultValues: {
      webhook_enabled: true,
      telegram_enabled: false,
      telegram_channel_id: "",
    },
  });

  /* eslint-disable react-hooks/set-state-in-effect -- populating form from fetched settings */
  useEffect(() => {
    if (settings) {
      form.reset({
        webhook_enabled: settings.webhook_enabled ?? true,
        telegram_enabled: settings.telegram_enabled ?? false,
        telegram_channel_id: settings.telegram_channel_id || "",
      });
      setAllowedIpsInput((settings.allowed_ips || []).join(", "));
    }
  }, [settings, form]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onSubmit = async (values: UserSettingsFormInput) => {
    try {
      setSubmitting(true);
      const allowed_ips = allowedIpsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await httpRequest<ApiResult>("patch", "analyst/settings", {
        ...values,
        allowed_ips,
      });

      if (res?.status === 1) {
        showSuccess(res.message || "Settings updated");
      } else {
        showError(res.message || "Failed to update settings");
      }
    } catch {
      showError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Analyst Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="webhook_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Signal Webhook</FormLabel>
                    <FormDescription>
                      Accept incoming signals from your API keys
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Allowed IPs</FormLabel>
              <FormControl>
                <Input
                  placeholder="Leave empty to allow any IP"
                  value={allowedIpsInput}
                  onChange={(e) => setAllowedIpsInput(e.target.value)}
                />
              </FormControl>
              <FormDescription>Comma-separated</FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="telegram_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Telegram Delivery</FormLabel>
                    <FormDescription>
                      Post published signals to your Telegram channel
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegram_channel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Channel ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. -1001234567890" {...field} />
                  </FormControl>
                  <FormDescription>
                    Add the platform bot as an admin of this channel first
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={submitting} className="mt-4">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
