"use client";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { AccountBlock } from "@/modules/account/AccountBlock";
import { DataTable } from "@/components/tsgrid/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAccountUserActivityPage() {
  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: "created_at",
      header: "Date",
    },
    {
      accessorKey: "client",
      header: "Device",
    },
    {
      accessorKey: "ip",
      header: "IP Address",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
  ];

  return (
    <>
      <AccountBlock activeTab="Activity" basePath="/admin" />
      <Card>
        <CardHeader>
          <CardTitle> Activity List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            queryKey={["admin-account-activity"]}
            fetcher={(params) =>
              httpRequest<ApiResult>(
                "get",
                "admin/account/user-activity",
                params,
              )
            }
            columns={columns}
            defaultLimit={10}
          />
        </CardContent>
      </Card>
    </>
  );
}
