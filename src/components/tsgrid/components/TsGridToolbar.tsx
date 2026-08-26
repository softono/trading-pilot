"use client";

import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { columnKey, columnTitle } from "../tsgrid.utils";
import { DebouncedInput } from "./DebouncedInput";

interface TsGridToolbarProps<T> {
  columns: ColumnDef<T, unknown>[];
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  sort: string;
  order: "asc" | "desc";
  onToggleSort: (field: string) => void;
  activeFilterCount: number;
  onToggleFilters: () => void;
  showFiltersToggle: boolean;
}

export function TsGridToolbar<T>({
  columns,
  search,
  onSearchChange,
  searchPlaceholder,
  sort,
  order,
  onToggleSort,
  activeFilterCount,
  onToggleFilters,
  showFiltersToggle,
}: TsGridToolbarProps<T>) {
  const sortableColumns = columns.filter((col) => col.meta?.sortable);

  const currentSortLabel = (() => {
    if (!sort) return "Sort";
    const col = sortableColumns.find((c) => columnKey(c) === sort);
    const name = col && typeof col.header === "string" ? col.header : sort;
    return `${name} ${order === "asc" ? "↑" : "↓"}`;
  })();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {showFiltersToggle && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1 md:hidden"
          onClick={onToggleFilters}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 rounded-full px-1.5 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      )}

      {sortableColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              {currentSortLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sortableColumns.map((col) => {
              const key = columnKey(col);
              const label = columnTitle(col) || key;
              const isActive = sort === key;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onToggleSort(key)}
                  className={cn(isActive && "font-medium")}
                >
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {order === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
            {sort && (
              <DropdownMenuItem onClick={() => onToggleSort(sort)}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Clear sort
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DebouncedInput
        value={search}
        onCommit={(v) => onSearchChange(v || "")}
        placeholder={searchPlaceholder}
        className="ml-auto h-9 w-full sm:max-w-[250px]"
      />
    </div>
  );
}
