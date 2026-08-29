"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { TsGrid } from "@/components/tsgrid/TsGrid";
import { Badge } from "@/components/ui/badge";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { ANALYST_TYPE_LABEL } from "@/modules/analyst/analyst.constants";
import type { AnalystProfile } from "@/modules/analyst/analyst.types";

const columns: ColumnDef<AnalystProfile>[] = [
  { accessorKey: "display_name", header: "Name", meta: { sortable: true } },
];

function AnalystCard({ row }: { row: AnalystProfile }) {
  const typeEntry = ANALYST_TYPE_LABEL[row.analyst_type];
  return (
    <Link href={`/analysts/${row.slug}`} className="group block">
      <div className="h-full rounded-lg border bg-card p-5 text-center transition-shadow hover:shadow-md">
        {row.avatar && (
          // eslint-disable-next-line @next/next/no-img-element -- avatar host is user-provided, arbitrary domains
          <img
            src={row.avatar}
            alt={row.display_name}
            className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
          />
        )}
        <h3 className="text-base font-semibold group-hover:text-primary">
          {row.display_name}
        </h3>
        {row.headline && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {row.headline}
          </p>
        )}
        <Badge variant={typeEntry.variant} className="mt-3 rounded-md">
          {typeEntry.label}
        </Badge>
      </div>
    </Link>
  );
}

export default function AnalystListPublicPage() {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Analysts</h1>
      <TsGrid<AnalystProfile>
        columns={columns}
        queryKey={["public-analysts"]}
        fetcher={(params) => httpRequest<ApiResult>("get", "analysts", params)}
        renderCard={(row) => <AnalystCard row={row} />}
        getRowId={(row) => row.id}
        defaultLimit={24}
        gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
