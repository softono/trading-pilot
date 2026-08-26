"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Mail, Calendar } from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import PageHeader from "@/components/admin/PageHeader";

export default function EmailTemplateView() {
  const { id } = useParams<{ id: string }>();
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["email_template", id],
    queryFn: () =>
      httpRequest<ApiResult>("get", `/admin/email-template/${id!}`),
    enabled: !!id,
  });

  const template = response?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Error" backUrl="/admin/email-templates" />
        <Card className="border-red-200 bg-red-50 mt-4">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error instanceof Error
                ? error.message
                : "Failed to load email template"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Template Not Found"
          backUrl="/admin/email-templates"
        />
        <Card className="border-yellow-200 bg-yellow-50 mt-4">
          <CardContent className="pt-6">
            <p className="text-yellow-600">Email template not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Email Template Details"
        backUrl="/admin/email-templates"
      />
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">
              Template Information
            </CardTitle>
            <div className="flex gap-2">
              <Link href={`/admin/email-templates/update/${template.id}`}>
                <Button size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Template
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title / Key */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Title / Key
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {template.title || template.key || "N/A"}
                </p>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Subject
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {template.subject || "N/A"}
                </p>
              </div>
            </div>

            {/* Created At */}
            {template.created_at && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-muted-foreground">
                  Created At
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-medium">{template.created_at}</p>
                </div>
              </div>
            )}
          </div>

          {/* Email Body Preview */}
          <div className="border rounded-lg p-4 bg-muted/10 space-y-2 mt-4">
            <label className="text-sm font-semibold text-muted-foreground block">
              HTML Body Preview
            </label>
            <div
              className="bg-white border rounded p-4 min-h-[250px] text-black overflow-auto"
              dangerouslySetInnerHTML={{ __html: template.body || "" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
