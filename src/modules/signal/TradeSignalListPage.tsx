"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { TsGrid } from "@/components/tsgrid/TsGrid";
import { Badge } from "@/components/ui/badge";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { SIGNAL_STATUS_LABEL } from "@/modules/signal/signal.constants";
import type { SignalListItem } from "@/modules/signal/signal.types";

const STATUS_OPTIONS = Object.entries(SIGNAL_STATUS_LABEL).map(
  ([value, info]) => ({ value, label: info.label }),
);

const columns: ColumnDef<SignalListItem>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol",
    meta: { sortable: true },
  },
  {
    accessorKey: "side",
    header: "Side",
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      sortable: true,
      filterVariant: "multiSelect",
      options: STATUS_OPTIONS,
    },
  },
  {
    accessorKey: "published_at",
    header: "Published",
    meta: { sortable: true },
  },
];

function SignalCard({ row }: { row: SignalListItem }) {
  const statusEntry =
    SIGNAL_STATUS_LABEL[row.status as keyof typeof SIGNAL_STATUS_LABEL] ?? null;

  return (
    <Link href={`/trade-signals/${row.id}`} className="group block">
      <div className="h-full rounded-lg border bg-card p-5 transition-shadow hover:shadow-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-base font-semibold group-hover:text-primary">
            {row.symbol}
          </span>
          <Badge variant={row.side === "long" ? "success" : "destructive"}>
            {row.side.toUpperCase()}
          </Badge>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">
          {row.company_name || row.exchange}
          {row.horizon ? ` · ${row.horizon}` : ""}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{row.analyst_name || "Analyst"}</span>
          {statusEntry && (
            <Badge variant={statusEntry.variant} className="rounded-md">
              {statusEntry.label}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

interface TradeSignalListPageProps {
  analystId?: string;
}

export default function TradeSignalListPage({
  analystId,
}: TradeSignalListPageProps) {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {analystId ? "Signals" : "Trade Signals"}
      </h1>
      <TsGrid<SignalListItem>
        columns={columns}
        queryKey={["trade-signals", analystId ?? "all"]}
        fetcher={(params) =>
          httpRequest<ApiResult>("get", "trade-signals", {
            ...params,
            ...(analystId ? { analyst_id: analystId } : {}),
          })
        }
        renderCard={(row) => <SignalCard row={row} />}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by symbol…"
        defaultLimit={12}
        pageSizeOptions={[12, 24, 48]}
        gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
