"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  FilterState,
  SelectOption,
  RangeConfig,
  FilterVariant,
} from "../tsgrid.types";
import {
  BOOLEAN_OPTIONS,
  columnKey,
  columnTitle,
  countActiveFilters,
  hasFilterValue,
} from "../tsgrid.utils";

interface TsGridFilterProps<T> {
  columns: ColumnDef<T, unknown>[];
  filter: FilterState;
  onFilterChange: (key: string, values: string[]) => void;
  onResetFilters: () => void;
}

export function TsGridFilter<T>({
  columns,
  filter,
  onFilterChange,
  onResetFilters,
}: TsGridFilterProps<T>) {
  const filterableColumns = columns.filter((col) => col.meta?.filterVariant);
  const activeCount = countActiveFilters(filter);

  if (filterableColumns.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">Filters</h3>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onResetFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-3 pt-2">
        {filterableColumns.map((col) => {
          const meta = col.meta!;
          const key = columnKey(col);
          const title = columnTitle(col) || "Filter";
          return (
            <FilterSection
              key={key}
              title={title}
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
    </div>
  );
}

// ── Section wrapper with collapsible ──────────────────────────────

function FilterSection({
  title,
  filterKey,
  variant,
  options,
  range,
  values,
  onChange,
}: {
  title: string;
  filterKey: string;
  variant: FilterVariant;
  options?: SelectOption[];
  range?: RangeConfig;
  values: string[];
  onChange: (filterKey: string, values: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasValue = hasFilterValue(variant, values);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between px-1 py-1 text-sm font-medium hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          {title}
          {hasValue && (
            <Badge
              variant="secondary"
              className="h-4 rounded-full px-1.5 text-[10px]"
            >
              {values.length}
            </Badge>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-1 pb-1 pt-1">
          {variant === "select" || variant === "multiSelect" ? (
            <SidebarSelectFacet
              multi={variant === "multiSelect"}
              options={options ?? []}
              values={values}
              onChange={(v) => onChange(filterKey, v)}
            />
          ) : variant === "boolean" ? (
            <SidebarSelectFacet
              multi={false}
              options={BOOLEAN_OPTIONS}
              values={values}
              onChange={(v) => onChange(filterKey, v)}
            />
          ) : variant === "range" || variant === "number" ? (
            <SidebarRangeFacet
              range={range}
              values={values}
              onChange={(v) => onChange(filterKey, v)}
            />
          ) : variant === "date" || variant === "dateRange" ? (
            <SidebarDateFacet
              values={values}
              onChange={(v) => onChange(filterKey, v)}
            />
          ) : (
            <SidebarTextFacet
              values={values}
              onChange={(v) => onChange(filterKey, v)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Facet controls (inline, not popover) ──────────────────────────

function SidebarSelectFacet({
  multi,
  options,
  values,
  onChange,
}: {
  multi: boolean;
  options: SelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const selected = new Set(values);

  const toggle = (val: string) => {
    if (!multi) {
      onChange(selected.has(val) ? [] : [val]);
      return;
    }
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-0.5">
      {options.map((option) => {
        const isSelected = selected.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              isSelected
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50",
            )}
          >
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "opacity-50 [&_svg]:invisible",
              )}
            >
              <Check className="h-3 w-3" />
            </div>
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
      {selected.size > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-1 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function SidebarRangeFacet({
  range,
  values,
  onChange,
}: {
  range?: RangeConfig;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [min, setMin] = useState(values[0] ?? "");
  const [max, setMax] = useState(values[1] ?? "");

  const apply = (a: string, b: string) => {
    setMin(a);
    setMax(b);
    onChange(a || b ? [a, b] : []);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={range ? String(range.min) : "Min"}
          value={min}
          onChange={(e) => apply(e.target.value, max)}
          className="h-8"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="number"
          placeholder={range ? String(range.max) : "Max"}
          value={max}
          onChange={(e) => apply(min, e.target.value)}
          className="h-8"
        />
      </div>
      {(min || max) && (
        <button
          type="button"
          onClick={() => apply("", "")}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function SidebarTextFacet({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [local, setLocal] = useState(values[0] ?? "");

  return (
    <div className="space-y-1.5">
      <Input
        placeholder="Contains…"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChange(local ? [local] : []);
        }}
        className="h-8"
      />
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={() => onChange(local ? [local] : [])}
        >
          Apply
        </Button>
        {local && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setLocal("");
              onChange([]);
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function SidebarDateFacet({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [from, setFrom] = useState(values[0] ?? "");
  const [to, setTo] = useState(values[1] ?? "");

  const apply = (a: string, b: string) => {
    setFrom(a);
    setTo(b);
    onChange(a || b ? [a, b] : []);
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs text-muted-foreground">From</label>
        <Input
          type="date"
          value={from}
          onChange={(e) => apply(e.target.value, to)}
          className="h-8"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground">To</label>
        <Input
          type="date"
          value={to}
          onChange={(e) => apply(from, e.target.value)}
          className="h-8"
        />
      </div>
      {(from || to) && (
        <button
          type="button"
          onClick={() => apply("", "")}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}
