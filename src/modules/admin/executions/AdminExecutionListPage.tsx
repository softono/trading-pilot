"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tsgrid/DataTable";
import { Badge } from "@/components/ui/badge";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import {
  EXECUTION_STATUS_LABEL,
  BROKER_LABEL,
} from "@/modules/broker/broker.constants";

interface AdminExecutionRow {
  id: number;
  connection_id: number;
  signal_id: number;
  status: string;
  reason: string | null;
  qty: number | null;
  created_at: string;
  symbol: string;
  broker: string;
}

const EXECUTIONS_QUERY_KEY = ["admin-executions"] as const;

const STATUS_OPTIONS = Object.entries(EXECUTION_STATUS_LABEL).map(
  ([value, info]) => ({ value, label: info.label }),
);

function StatusBadge({ status }: { status: string }) {
  const entry =
    EXECUTION_STATUS_LABEL[status as keyof typeof EXECUTION_STATUS_LABEL] ??
    EXECUTION_STATUS_LABEL.pending;
  return (
    <Badge variant={entry.variant} className="rounded-md">
      {entry.label}
    </Badge>
  );
}

export default function AdminExecutionListPage() {
  const columns: ColumnDef<AdminExecutionRow>[] = useMemo(
    () => [
      {
        id: "symbol",
        accessorKey: "symbol",
        header: "Symbol",
        meta: { filterVariant: "text" },
      },
      {
        id: "broker",
        accessorKey: "broker",
        header: "Broker",
        cell: ({ row }) =>
          BROKER_LABEL[row.original.broker as keyof typeof BROKER_LABEL] ??
          row.original.broker,
      },
      { id: "qty", accessorKey: "qty", header: "Qty" },
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
      { id: "reason", accessorKey: "reason", header: "Reason" },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Date",
        meta: { sortable: true },
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Executions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Order Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AdminExecutionRow>
            columns={columns}
            queryKey={EXECUTIONS_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/executions", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
