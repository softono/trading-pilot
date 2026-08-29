"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tsgrid/DataTable";
import { Badge } from "@/components/ui/badge";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { SIGNAL_STATUS_LABEL } from "@/modules/signal/signal.constants";

interface AdminSignalRow {
  id: number;
  analyst_id: string;
  analyst_name: string | null;
  symbol: string;
  side: string;
  horizon: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

const SIGNALS_QUERY_KEY = ["admin-signals"] as const;

const STATUS_OPTIONS = Object.entries(SIGNAL_STATUS_LABEL).map(
  ([value, info]) => ({ value, label: info.label }),
);

function StatusBadge({ status }: { status: string }) {
  const entry =
    SIGNAL_STATUS_LABEL[status as keyof typeof SIGNAL_STATUS_LABEL] ?? null;
  if (!entry) return <span>{status}</span>;
  return (
    <Badge variant={entry.variant} className="rounded-md">
      {entry.label}
    </Badge>
  );
}

export default function AdminSignalListPage() {
  const columns: ColumnDef<AdminSignalRow>[] = useMemo(
    () => [
      {
        id: "symbol",
        accessorKey: "symbol",
        header: "Symbol",
        meta: { sortable: true, filterVariant: "text" },
      },
      { id: "side", accessorKey: "side", header: "Side" },
      { id: "analyst_name", accessorKey: "analyst_name", header: "Analyst" },
      { id: "horizon", accessorKey: "horizon", header: "Horizon" },
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
        id: "published_at",
        accessorKey: "published_at",
        header: "Published",
        meta: { sortable: true },
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Signals</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AdminSignalRow>
            columns={columns}
            queryKey={SIGNALS_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/signals", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
