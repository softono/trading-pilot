"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tsgrid/DataTable";
import { Eye, MoreHorizontal } from "lucide-react";
import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { AnalystApplication } from "@/modules/analyst/analyst.types";
import { useAuth } from "@/context/AdminAuthContext";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APPLICATION_STATUS_LABEL } from "@/modules/analyst/analyst.constants";

const APPLICATION_QUERY_KEY = ["analyst-applications"] as const;

const STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABEL).map(
  ([value, info]) => ({ value, label: info.label }),
);

function StatusBadge({ status }: { status: string }) {
  const entry =
    APPLICATION_STATUS_LABEL[status as keyof typeof APPLICATION_STATUS_LABEL] ??
    APPLICATION_STATUS_LABEL.pending;
  return (
    <Badge variant={entry.variant} className="rounded-md">
      {entry.label}
    </Badge>
  );
}

export default function AnalystApplicationListPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  const handleView = useCallback(
    (id: number) => router.push(`/admin/analyst-applications/view/${id}`),
    [router],
  );

  const columns: ColumnDef<AnalystApplication>[] = useMemo(() => {
    const cols: ColumnDef<AnalystApplication>[] = [
      {
        id: "name",
        header: "Applicant",
        cell: ({ row }) =>
          `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim(),
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        meta: { sortable: false, filterVariant: "text" },
      },
      {
        id: "experience_years",
        accessorKey: "experience_years",
        header: "Experience (yrs)",
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        meta: {
          sortable: true,
          filterVariant: "multiSelect",
          options: STATUS_OPTIONS,
        },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Applied At",
        meta: { sortable: true, filterVariant: "date" },
      },
    ];

    if (hasPermission("admin/analyst-application/view")) {
      cols.push({
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(row.original.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      });
    }

    return cols;
  }, [handleView, hasPermission]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analyst Applications</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AnalystApplication>
            columns={columns}
            queryKey={APPLICATION_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>(
                "get",
                "admin/analyst-applications",
                params,
              )
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
