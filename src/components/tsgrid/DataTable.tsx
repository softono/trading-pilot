"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ListFetcherProps, ServerColumnMeta } from "./tsgrid.types";
import { Pagination } from "./Pagination";
import { DataTableToolbar } from "./components/DataTableToolbar";
import { useServerData } from "./hooks/useServerData";

// ── localStorage for column visibility ─────────────────────────────

function visibilityKey(queryKey: readonly unknown[]): string {
  return `dt-vis-${JSON.stringify(queryKey)}`;
}

function loadVisibility(queryKey: readonly unknown[]): VisibilityState {
  try {
    const raw = localStorage.getItem(visibilityKey(queryKey));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

function saveVisibility(queryKey: readonly unknown[], state: VisibilityState) {
  try {
    localStorage.setItem(visibilityKey(queryKey), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function alignClass(align?: ServerColumnMeta["align"]) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "";
}

// ── DataTable ──────────────────────────────────────────────────────

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  queryKey: readonly unknown[];
  searchPlaceholder?: string;
  defaultLimit?: number;
  pageSizeOptions?: number[];
  showSerial?: boolean;
  syncUrl?: boolean;
  enableColumnVisibility?: boolean;
} & ListFetcherProps;

export function DataTable<T>({
  columns,
  queryKey,
  fetcher,
  fetcherDataType = "flat",
  searchPlaceholder = "Search…",
  defaultLimit = 20,
  pageSizeOptions = [10, 20, 50, 100],
  showSerial = true,
  syncUrl = true,
  enableColumnVisibility = true,
}: DataTableProps<T>) {
  const serverData = useServerData<T>({
    columns,
    queryKey,
    fetcher,
    fetcherDataType,
    defaultLimit,
    syncUrl,
  });

  const {
    list,
    pagination,
    page,
    limit,
    sort,
    order,
    search,
    filter,
    isLoading,
    isFetching,
    errorMessage,
    setPage,
    setLimit,
    toggleSort,
    setSearch,
    setFilter,
    resetFilters,
  } = serverData;

  const offset = (page - 1) * limit;

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => (enableColumnVisibility ? loadVisibility(queryKey) : {}),
  );

  useEffect(() => {
    if (enableColumnVisibility) saveVisibility(queryKey, columnVisibility);
  }, [columnVisibility, enableColumnVisibility, queryKey]);

  const allColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!showSerial) return columns;
    const serial: ColumnDef<T, unknown> = {
      id: "__serial",
      header: "#",
      size: 48,
      cell: ({ row }) => offset + row.index + 1,
      enableHiding: false,
    };
    return [serial, ...columns];
  }, [columns, showSerial, offset]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: list,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const colCount = visibleColumns.length;

  return (
    <div>
      <DataTableToolbar
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        filter={filter}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        enableColumnVisibility={enableColumnVisibility}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const colKey = meta?.filterKey || header.column.id;
                  const isSorted = sort === colKey;
                  const sizeStyle = header.column.columnDef.size
                    ? { width: header.column.columnDef.size }
                    : undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(alignClass(meta?.align))}
                      style={sizeStyle}
                    >
                      {meta?.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(colKey)}
                          className={cn(
                            "flex select-none items-center gap-1 font-medium",
                            meta?.align === "center" && "mx-auto",
                            meta?.align === "right" && "ml-auto",
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {isSorted ? (
                            order === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody
            className={cn(
              isFetching && !isLoading && "opacity-60 transition-opacity",
            )}
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, r) => (
                <TableRow key={`s-${r}`}>
                  {Array.from({ length: colCount }).map((__, c) => (
                    <TableCell key={c}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : errorMessage ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={colCount}
                  className="py-10 text-center text-sm text-destructive"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={colCount}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        alignClass(cell.column.columnDef.meta?.align),
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          count={pagination.count}
          limit={limit}
          pageSizeOptions={pageSizeOptions}
          onPage={(p) => setPage(p)}
          onLimitChange={setLimit}
        />
      )}
    </div>
  );
}
