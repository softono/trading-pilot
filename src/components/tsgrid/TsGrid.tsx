"use client";

import { type ReactNode, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ListFetcherProps } from "./tsgrid.types";
import { countActiveFilters } from "./tsgrid.utils";
import { useServerData } from "./hooks/useServerData";
import { TsGridFilter } from "./components/TsGridFilter";
import { TsGridToolbar } from "./components/TsGridToolbar";
import { Pagination } from "./Pagination";

type TsGridProps<T> = {
  columns: ColumnDef<T, unknown>[];
  queryKey: readonly unknown[];
  renderCard: (row: T) => ReactNode;
  getRowId?: (row: T) => string | number;
  gridClassName?: string;
  searchPlaceholder?: string;
  defaultLimit?: number;
  pageSizeOptions?: number[];
  syncUrl?: boolean;
} & ListFetcherProps;

export function TsGrid<T>({
  columns,
  queryKey,
  fetcher,
  fetcherDataType = "flat",
  renderCard,
  getRowId,
  gridClassName,
  searchPlaceholder = "Search…",
  defaultLimit = 20,
  pageSizeOptions = [10, 20, 50, 100],
  syncUrl = true,
}: TsGridProps<T>) {
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

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasFilterableColumns = columns.some((col) => col.meta?.filterVariant);
  const activeFilterCount = countActiveFilters(filter);

  const filterContent = hasFilterableColumns ? (
    <TsGridFilter
      columns={columns}
      filter={filter}
      onFilterChange={setFilter}
      onResetFilters={resetFilters}
    />
  ) : null;

  return (
    <div className="flex gap-6">
      {/* Desktop sidebar */}
      {filterContent && (
        <aside className="hidden w-[240px] shrink-0 md:block">
          {filterContent}
        </aside>
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <TsGridToolbar
          columns={columns}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          sort={sort}
          order={order}
          onToggleSort={toggleSort}
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setMobileFiltersOpen(true)}
          showFiltersToggle={hasFilterableColumns}
        />

        {/* Mobile filter sheet */}
        {filterContent && (
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left" className="w-[280px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{filterContent}</div>
            </SheetContent>
          </Sheet>
        )}

        {/* Card grid */}
        <div
          className={cn(
            isFetching && !isLoading && "opacity-60 transition-opacity",
          )}
        >
          {isLoading ? (
            <div
              className={
                gridClassName ||
                "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-48 animate-pulse rounded-lg border bg-muted"
                />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No records found</p>
            </div>
          ) : (
            <div
              className={
                gridClassName ||
                "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }
            >
              {list.map((row, index) => (
                <div key={getRowId ? getRowId(row) : index}>
                  {renderCard(row)}
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}
