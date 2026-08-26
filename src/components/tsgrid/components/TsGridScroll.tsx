"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ApiResult, PaginationInput } from "../tsgrid.types";
import { useInfiniteServerData } from "../hooks/useInfiniteServerData";
import { countActiveFilters } from "../tsgrid.utils";
import { TsGridFilter } from "./TsGridFilter";
import { TsGridToolbar } from "./TsGridToolbar";

interface TsGridScrollProps<T> {
  columns: ColumnDef<T, unknown>[];
  queryKey: readonly unknown[];
  fetcher: (body: PaginationInput) => Promise<ApiResult>;
  renderCard: (row: T) => ReactNode;
  getRowId?: (row: T) => string | number;
  gridClassName?: string;
  searchPlaceholder?: string;
  defaultLimit?: number;
}

export function TsGridScroll<T>({
  columns,
  queryKey,
  fetcher,
  renderCard,
  getRowId,
  gridClassName,
  searchPlaceholder = "Search…",
  defaultLimit = 20,
}: TsGridScrollProps<T>) {
  const {
    list,
    pagination,
    sort,
    order,
    search,
    filter,
    isLoading,
    isFetchingNextPage,
    errorMessage,
    hasNextPage,
    fetchNextPage,
    toggleSort,
    setSearch,
    setFilter,
    resetFilters,
  } = useInfiniteServerData<T>({ columns, queryKey, fetcher, defaultLimit });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasFilterableColumns = columns.some((col) => col.meta?.filterVariant);
  const activeFilterCount = countActiveFilters(filter);

  const gridClasses =
    gridClassName || "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

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

        {isLoading ? (
          <div className={gridClasses}>
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
          <>
            <div className={gridClasses}>
              {list.map((row, index) => (
                <div key={getRowId ? getRowId(row) : index}>
                  {renderCard(row)}
                </div>
              ))}
            </div>

            {/* Infinite-scroll sentinel + loaders */}
            <div ref={sentinelRef} className="h-px" />

            {isFetchingNextPage && (
              <div className={cn(gridClasses, "mt-4")}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`more-skeleton-${i}`}
                    className="h-48 animate-pulse rounded-lg border bg-muted"
                  />
                ))}
              </div>
            )}

            {!hasNextPage && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {pagination?.count ?? "No more records"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
