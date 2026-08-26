"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tsgrid/DataTable";
import { Badge } from "@/components/ui/badge";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { OrderExecution } from "@/modules/broker/broker.types";
import { EXECUTION_STATUS_LABEL } from "@/modules/broker/broker.constants";
import { TradingNav } from "@/components/common/TradingNav";

const EXECUTIONS_QUERY_KEY = ["executions"] as const;

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

export default function ExecutionListPage() {
  const columns: ColumnDef<OrderExecution>[] = useMemo(
    () => [
      { id: "symbol", accessorKey: "symbol", header: "Symbol" },
      { id: "side", accessorKey: "side", header: "Side" },
      { id: "broker", accessorKey: "broker", header: "Broker" },
      { id: "qty", accessorKey: "qty", header: "Qty" },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        meta: {
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
      <TradingNav />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Executions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<OrderExecution>
            columns={columns}
            queryKey={EXECUTIONS_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "executions", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
