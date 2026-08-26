"use client";

import { useState } from "react";
import type { Table } from "@tanstack/react-table";
import { Filter, X, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { FilterState } from "../tsgrid.types";
import { columnKey, columnTitle, countActiveFilters } from "../tsgrid.utils";
import { DataTableFilter } from "./DataTableFilter";
import { DebouncedInput } from "./DebouncedInput";

interface DataTableToolbarProps<T> {
  table: Table<T>;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  filter: FilterState;
  onFilterChange: (key: string, values: string[]) => void;
  onResetFilters: () => void;
  enableColumnVisibility?: boolean;
}

export function DataTableToolbar<T>({
  table,
  search,
  onSearchChange,
  searchPlaceholder,
  filter,
  onFilterChange,
  onResetFilters,
  enableColumnVisibility,
}: DataTableToolbarProps<T>) {
  const filterableColumns = table
    .getAllLeafColumns()
    .filter((col) => col.columnDef.meta?.filterVariant);

  const activeCount = countActiveFilters(filter);
  const [showFilters, setShowFilters] = useState(activeCount > 0);
  const isFiltered = activeCount > 0 || search.length > 0;

  const resetAll = () => {
    onSearchChange("");
    onResetFilters();
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Columns3 className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {filterableColumns.length > 0 && (
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-1"
            onClick={() => setShowFilters((s) => !s)}
          >
            <Filter className="h-3.5 w-3.5" />
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 rounded-full px-1.5 text-xs"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1"
            onClick={resetAll}
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
        <DebouncedInput
          value={search}
          onCommit={(v) => onSearchChange(v || "")}
          placeholder={searchPlaceholder}
          className="ml-auto h-9 w-full sm:max-w-[250px]"
        />
      </div>

      {showFilters && filterableColumns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filterableColumns.map((col) => {
            const meta = col.columnDef.meta!;
            const key = columnKey(col.columnDef) || col.id;
            return (
              <DataTableFilter
                key={col.id}
                title={columnTitle(col.columnDef) || col.id}
                filterKey={key}
                variant={meta.filterVariant!}
                options={meta.options}
                range={meta.range}
                values={filter[key] ?? []}
                onChange={onFilterChange}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
