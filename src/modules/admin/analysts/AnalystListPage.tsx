"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tsgrid/DataTable";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { AnalystProfile } from "@/modules/analyst/analyst.types";
import { Badge } from "@/components/ui/badge";
import { ANALYST_TYPE_LABEL } from "@/modules/analyst/analyst.constants";

const ANALYST_QUERY_KEY = ["analysts"] as const;

const TYPE_OPTIONS = Object.entries(ANALYST_TYPE_LABEL).map(
  ([value, info]) => ({ value, label: info.label }),
);

export default function AnalystListPage() {
  const columns: ColumnDef<AnalystProfile>[] = useMemo(
    () => [
      {
        id: "display_name",
        accessorKey: "display_name",
        header: "Name",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
      },
      {
        id: "slug",
        accessorKey: "slug",
        header: "Slug",
      },
      {
        id: "analyst_type",
        accessorKey: "analyst_type",
        header: "Type",
        meta: {
          sortable: true,
          filterVariant: "multiSelect",
          options: TYPE_OPTIONS,
        },
        cell: ({ row }) => {
          const entry =
            ANALYST_TYPE_LABEL[row.original.analyst_type] ??
            ANALYST_TYPE_LABEL.human;
          return (
            <Badge variant={entry.variant} className="rounded-md">
              {entry.label}
            </Badge>
          );
        },
      },
      {
        id: "is_public",
        accessorKey: "is_public",
        header: "Public",
        cell: ({ row }) => (row.original.is_public ? "Yes" : "No"),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        meta: { sortable: true, filterVariant: "date" },
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analysts</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analysts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AnalystProfile>
            columns={columns}
            queryKey={ANALYST_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/analysts", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
