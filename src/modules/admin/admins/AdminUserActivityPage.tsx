"use client";
import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserActivity } from "@/modules/account/user.types";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIVITY_QUERY_KEY = ["user-activities"] as const;
import { DataTable } from "@/components/tsgrid/DataTable";

export default function UserActivityPage() {
  const columns: ColumnDef<UserActivity>[] = [
    {
      id: "created_at",
      header: "Date",
      accessorKey: "created_at",
      meta: { sortable: true, filterVariant: "date" },
    },
    {
      id: "type",
      header: "Type",
      meta: { sortable: true, filterVariant: "text" },
      cell: ({ row }) => row.original.type || "-",
    },
    {
      id: "first_name",
      header: "Name",
      cell: ({ row }) =>
        `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim() ||
        "-",
    },
    {
      id: "email",
      header: "Email",
      meta: { sortable: true, filterVariant: "text" },
      cell: ({ row }) => row.original.email || "-",
    },
    {
      id: "role",
      header: "User Type",
      cell: ({ row }) => row.original.role ?? "-",
    },
    {
      id: "device_id",
      header: "Device",
      cell: ({ row }) => row.original.client || "-",
    },
    {
      id: "ip",
      header: "IP",
      meta: { sortable: true, filterVariant: "text" },
      cell: ({ row }) => row.original.ip || "-",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<UserActivity>
          columns={columns}
          queryKey={ACTIVITY_QUERY_KEY}
          fetcher={(params) =>
            httpRequest<ApiResult>("get", "admin/user-activities", params)
          }
        />
      </CardContent>
    </Card>
  );
}
