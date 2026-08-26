"use client";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { UserStatusBadge } from "@/components/badge/UserStatusBadge";
import { DataTable } from "@/components/tsgrid/DataTable";
import {
  Loader2,
  Trash2,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Send,
  LogIn,
  Clock,
  Globe,
  Network,
  ShieldCheck,
} from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { SendMailDialog } from "@/modules/admin/users/SendMailDialog";
import { useAuth } from "@/context/AdminAuthContext";
import { showError, showSuccess } from "@/lib/message";
import PageHeader from "@/components/admin/PageHeader";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useState } from "react";

const USERS_QUERY_KEY = ["user"] as const;

export default function AdminUserViewPage() {
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [imageError, setImageError] = useState(false);

  const { deleteItem: handleDeleteItem } = useDeleteEntity(
    (id: string) => httpRequest<ApiResult>("delete", `/admin/users/${id}`),
    USERS_QUERY_KEY,
    "User",
  );

  const {
    data: userRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => httpRequest<ApiResult>("get", `/admin/users/${id!}`),
    enabled: !!id,
  });

  const user = userRes?.data;

  // Column Definitions for Recent sessions
  const sessionsColumns = [
    {
      accessorKey: "client",
      header: "Client",
    },
    {
      accessorKey: "ip",
      header: "IP",
    },
    {
      accessorKey: "last_activity",
      header: "Date",
    },
  ];

  // Column Definitions for Recent Activity
  const activityColumns = [
    {
      accessorKey: "type",
      header: "Type",
    },
    { accessorKey: "client", header: "Client" },
    { accessorKey: "ip", header: "IP" },
    {
      accessorKey: "created_at",
      header: "Date",
    },
  ];

  // Column Definitions for Sent Mails
  const mailsColumns = [
    { accessorKey: "to_user", header: "To" },
    { accessorKey: "subject", header: "Subject" },
    { accessorKey: "message", header: "Message" },
    {
      accessorKey: "created_at",
      header: "Sent Date",
    },
  ];

  const handleDelete = async () => {
    try {
      if (!id) {
        showError("User ID not found");
        return;
      }
      await handleDeleteItem(id);
      router.push("/admin/users");
    } catch {
      // Error already handled by hook
    }
  };

  const handleAutoLogin = async (userId: number | string) => {
    try {
      const response = await httpRequest<ApiResult>(
        "patch",
        "admin/users/autologin",
        { id: userId },
      );
      const data = response as unknown as Record<string, unknown>;
      const respData = data?.data as Record<string, unknown> | undefined;
      if (data?.status === 1 && (respData?.token || respData?.auth_token)) {
        const frontUrl =
          process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const authToken = respData?.token || respData?.auth_token;
        window.open(`${frontUrl}/dashboard?auth_token=${authToken}`, "_blank");
      } else {
        showError("Auto login failed");
      }
    } catch {
      showError("Auto login failed");
    }
  };

  if (!id) {
    return (
      <>
        <PageHeader title="Invalid User" backUrl="/admin/users" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">User ID is missing.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Error" backUrl="/admin/users" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load user"}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageHeader title="User Not Found" showBackBtn={true} />
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-600">User not found</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="User Details" showBackBtn={true} />

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="w-full justify-start flex-wrap gap-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Recent Sessions
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="mails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Sent Mails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex flex-row items-center justify-between">
                <CardTitle>Profile Information</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {hasPermission("admin/user/update") && (
                    <Link href={`/admin/users/update/${user.id}`}>
                      <Button size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                  )}
                  {hasPermission("admin/user/delete") && (
                    <ConfirmationDialog
                      title="Delete User"
                      description="Are you sure you want to delete this user?"
                      confirmText="Delete"
                      cancelText="Cancel"
                      onConfirm={() => handleDelete()}
                    >
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </ConfirmationDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="shrink-0 flex justify-center md:justify-start">
                  {user.image && !imageError ? (
                    <Image
                      src={user.image}
                      alt={user.first_name}
                      width={128}
                      height={128}
                      className="h-32 w-32 rounded-full border-4 border-gray-200 object-cover"
                      onError={() => setImageError(true)}
                      unoptimized
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Username
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      First Name
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">{user.first_name}</p>
                    </div>
                  </div>{" "}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Name
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">{user.last_name}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {user.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {user.country || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Account Status
                    </label>
                    <div className="mt-1">
                      <UserStatusBadge status={user.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email Status
                    </label>
                    <div className="mt-1">
                      <p className="text-lg font-semibold">
                        {user.email_verified === true
                          ? "Verified"
                          : user.email_verified === false
                            ? "Not verified"
                            : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      2FA Status
                    </label>
                    <div className="mt-1">
                      <p className="text-lg font-semibold">
                        {user.two_factor_enabled === true
                          ? "Enabled"
                          : user.two_factor_enabled === false
                            ? "Disabled"
                            : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Time Zone
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {user.timezone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Registered IP
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Network className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {user.registered_ip || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">{user.created_at}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">{user.updated_at}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Actions
                    </label>
                    <div className="flex gap-2 mt-1">
                      {hasPermission("admin/user/autologin") && (
                        <Button
                          onClick={() => handleAutoLogin(user.id)}
                          size="sm"
                          title="Login as User"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Login as User
                        </Button>
                      )}

                      {hasPermission("admin/user/send-tfa-mail") && (
                        <Button
                          onClick={async () => {
                            try {
                              const response = await httpRequest<ApiResult>(
                                "patch",
                                "admin/users/send-tfa-mail",
                                { id: user.id },
                              );
                              if (response.status === 1) {
                                showSuccess(
                                  response.message ||
                                    "Verification mail sent successfully",
                                );
                              } else {
                                showError(
                                  response.message ||
                                    "Failed to send verification mail",
                                );
                              }
                            } catch (error: unknown) {
                              showError(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to send verification mail",
                              );
                            }
                          }}
                          size="sm"
                          title="Re-send Verification Mail"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Re-send Verification Mail
                        </Button>
                      )}

                      <SendMailDialog userEmail={user.email}>
                        <Button size="sm">
                          <Send className="mr-2 h-4 w-4" />
                          Send Mail
                        </Button>
                      </SendMailDialog>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                queryKey={["user-sessions", id]}
                fetcher={(params) =>
                  httpRequest<ApiResult>(
                    "get",
                    `/admin/users/${id}/sessions`,
                    params,
                  )
                }
                columns={sessionsColumns}
                syncUrl={false}
                defaultLimit={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                queryKey={["user-activity", id]}
                fetcher={(params) =>
                  httpRequest<ApiResult>(
                    "get",
                    `/admin/users/${id}/activity`,
                    params,
                  )
                }
                columns={activityColumns}
                syncUrl={false}
                defaultLimit={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mails">
          <Card>
            <CardHeader>
              <CardTitle>Sent Mails</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                queryKey={["user-mails", id]}
                fetcher={(params) =>
                  httpRequest<ApiResult>(
                    "get",
                    `/admin/users/${id}/mails`,
                    params,
                  )
                }
                columns={mailsColumns}
                syncUrl={false}
                defaultLimit={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
