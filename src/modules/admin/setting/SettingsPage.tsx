"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { showError, showSuccess } from "@/lib/message";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import {
  type GeneralSettings,
  type SmtpSettings,
  type CaptchaSettings,
  type SocialSettings,
  type ContentSettings,
} from "@/types/admin";
import { GeneralTab } from "@/modules/admin/setting/components/GeneralTab";
import { MailTab } from "@/modules/admin/setting/components/MailTab";
import { CaptchaTab } from "@/modules/admin/setting/components/CaptchaTab";
import { SocialTab } from "@/modules/admin/setting/components/SocialTab";
import { ContentTab } from "@/modules/admin/setting/components/ContentTab";
import { useAuth } from "@/context/AdminAuthContext";
import PageHeader from "@/components/admin/PageHeader";

export default function SettingsPage() {
  const { hasPermission } = useAuth();

  const {
    data: settingsRes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: () => httpRequest<ApiResult>("get", "admin/setting/update"),
  });

  const settings = settingsRes?.data as
    | Record<string, string | number>
    | undefined;

  const [generalForm, setGeneralForm] = useState<GeneralSettings>({
    admin_email: "",
    date_format: "Y-m-d",
    date_time_format: "Y-m-d h:i A",
    user_login_with_otp: "1",
    cookie_consent: "1",
    user_email_verify: "1",
  });

  const [smtpForm, setSmtpForm] = useState<SmtpSettings>({
    smtp_host: "",
    smtp_encryption: "ssl",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    mail_from_name: "",
    mail_from_address: "",
  });

  const [captchaForm, setCaptchaForm] = useState<CaptchaSettings>({
    google_recaptcha: "0",
    google_recaptcha_secret_key: "",
    google_recaptcha_public_key: "",
  });

  const [socialForm, setSocialForm] = useState<SocialSettings>({
    google_login: "0",
    google_client_id: "",
    google_client_secret: "",
  });

  const [contentForm, setContentForm] = useState<ContentSettings>({
    header_content: "",
    footer_content: "",
  });

  /* eslint-disable react-hooks/set-state-in-effect -- populating form state from fetched settings */
  useEffect(() => {
    if (!settings) return;
    setGeneralForm({
      admin_email: String(settings["admin_email"] || ""),
      date_format: String(settings["date_format"] || "Y-m-d"),
      date_time_format: String(settings["date_time_format"] || "Y-m-d h:i A"),
      user_login_with_otp: String(settings["user_login_with_otp"] || "0"),
      cookie_consent: String(settings["cookie_consent"] || "0"),
      user_email_verify: String(settings["user_email_verify"] || "0"),
    });
    setSmtpForm({
      smtp_host: String(settings["smtp_host"] || ""),
      smtp_encryption: String(settings["smtp_encryption"] || "ssl") as
        | "ssl"
        | "tls",
      smtp_port: String(settings["smtp_port"] || ""),
      smtp_username: String(settings["smtp_username"] || ""),
      smtp_password: String(settings["smtp_password"] || ""),
      mail_from_name: String(settings["mail_from_name"] || ""),
      mail_from_address: String(settings["mail_from_address"] || ""),
    });
    setCaptchaForm({
      google_recaptcha: String(settings["google_recaptcha"] || "0"),
      google_recaptcha_secret_key: String(
        settings["google_recaptcha_secret_key"] || "",
      ),
      google_recaptcha_public_key: String(
        settings["google_recaptcha_public_key"] || "",
      ),
    });
    setSocialForm({
      google_login: String(settings["google_login"] || "0"),
      google_client_id: String(settings.google_client_id || ""),
      google_client_secret: String(settings.google_client_secret || ""),
    });
    setContentForm({
      header_content: String(settings["header_content"] || ""),
      footer_content: String(settings["footer_content"] || ""),
    });
  }, [settings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cacheMutation = useMutation({
    mutationFn: () =>
      httpRequest<ApiResult>("get", "admin/setting/cache-clear"),
    onSuccess: (response) =>
      response.status === 1
        ? showSuccess(response.message || "Cache cleared successfully")
        : showError(response.message || "Failed to clear cache"),
    onError: () => showError("Failed to clear cache"),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Settings" showBackBtn={false} />

        {hasPermission("admin/setting/update") && (
          <Button
            onClick={() => cacheMutation.mutate()}
            disabled={cacheMutation.isPending}
          >
            {cacheMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              "Clear Cache"
            )}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="mail">Mail</TabsTrigger>
              <TabsTrigger value="recaptcha">reCAPTCHA</TabsTrigger>
              <TabsTrigger value="social">Social Login</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <GeneralTab
                form={generalForm}
                setForm={setGeneralForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="mail">
              <MailTab
                form={smtpForm}
                setForm={setSmtpForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="recaptcha">
              <CaptchaTab
                form={captchaForm}
                setForm={setCaptchaForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="social">
              <SocialTab
                form={socialForm}
                setForm={setSocialForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="content">
              <ContentTab
                form={contentForm}
                setForm={setContentForm}
                refetch={refetch}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
