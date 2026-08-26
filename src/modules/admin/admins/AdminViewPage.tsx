"use client";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserStatusBadge } from "@/components/badge/UserStatusBadge";
import { DataTable } from "@/components/tsgrid/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Trash2,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Network,
  Clock,
  Globe,
} from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { getPermissionListData } from "@/modules/account/permission";
import PageHeader from "@/components/admin/PageHeader";

const ADMIN_QUERY_KEY = ["admins"] as const;

export default function AdminView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { deleteMutation } = useDeleteEntity(
    (id: string) => httpRequest<ApiResult>("delete", `admin/admins/${id}`),
    ADMIN_QUERY_KEY,
    "Admin",
  );

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      router.push("/admin/admins");
    } catch {
      // Error already handled by the hook
    }
  };

  const {
    data: adminRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [ADMIN_QUERY_KEY, id],
    queryFn: () => httpRequest<ApiResult>("get", `/admin/admins/${id!}`),
    enabled: !!id,
  });

  const admin = adminRes?.data;

  const sessionsColumns = [
    {
      accessorKey: "client",
      header: "Device",
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

  const activityColumns = [
    {
      accessorKey: "client",
      header: "Client",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "ip",
      header: "IP",
    },
    {
      accessorKey: "created_at",
      header: "Date",
    },
  ];

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
        <PageHeader title="Error" backUrl="/admin/admins" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load admin"}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!admin) {
    return (
      <>
        <PageHeader title="User Not Found" backUrl="/admin/admins" />
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-600">admin not found</p>
          </CardContent>
        </Card>
      </>
    );
  }
  const adminPermissions = admin.permission
    ? admin.permission.split(",").map((p: string) => p.trim())
    : [];

  return (
    <>
      <PageHeader title="Admin Details" backUrl="/admin/admins" />
      <Tabs defaultValue="profile" className="mt-6">
        {/** Tabs triggers permission ke basis par generate honge **/}
        <TabsList className="w-full justify-start flex-wrap gap-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Recent Sessions
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex flex-row items-center justify-between">
                <CardTitle>Profile Information</CardTitle>
                <div className="flex gap-2">
                  <Link href={`/admin/admins/update/${admin.id}`}>
                    <Button size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <ConfirmationDialog
                    title="Delete Admin"
                    description="Are you sure you want to delete this admin?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDelete}
                  >
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </ConfirmationDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image and Details */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0 flex justify-center md:justify-start">
                  {admin.image ? (
                    <Image
                      src={admin.image}
                      alt={admin.first_name}
                      width={128}
                      height={128}
                      className="h-32 w-32 rounded-full border-4 border-gray-200 object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23e5e7eb"/%3E%3C/svg%3E';
                      }}
                      unoptimized
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center  text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>

                {/* Admin Details Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Username
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {`${admin.first_name || ""} ${admin.last_name || ""}`.trim()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      First Name
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {admin.first_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Name
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">{admin.last_name}</p>
                    </div>
                  </div>
                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">{admin.email}</p>
                    </div>
                  </div>
                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {admin.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                  {/* Country */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {admin.country || "N/A"}
                      </p>
                    </div>
                  </div>
                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Account Status
                    </label>
                    <div className="mt-1">
                      <UserStatusBadge status={admin.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email Status
                    </label>
                    <div className="mt-1">
                      <p className="text-lg font-semibold">
                        {admin.email_verified === true
                          ? "Verified"
                          : admin.email_verified === false
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
                        {admin.two_factor_enabled === true
                          ? "Enabled"
                          : admin.two_factor_enabled === false
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
                        {admin.timezone || "N/A"}
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
                        {admin.registered_ip || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium  text-muted-foreground">
                      Created At
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-5 w-5  text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {admin.created_at}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <p className="text-lg font-semibold">
                        {admin.updated_at}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPermissionListData().map((group) => (
                  <div
                    key={group.key}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <h3 className="text-sm font-medium  text-muted-foreground">
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.list?.map((perm) => {
                        const hasPermission = adminPermissions.includes(
                          perm.key,
                        );
                        return (
                          <div
                            key={perm.key}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{perm.title}</span>
                            {hasPermission ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          {/* Recent sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                queryKey={["admin-session", id]}
                fetcher={(params) =>
                  httpRequest<ApiResult>(
                    "get",
                    `/admin/admins/${id!}/session`,
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
          {/* Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                queryKey={["admin-activity", id]}
                fetcher={(params) =>
                  httpRequest<ApiResult>(
                    "get",
                    `/admin/admins/${id!}/activity`,
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
      </Tabs>
    </>
  );
}
