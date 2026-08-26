"use client";

import { useState } from "react";
import { PlusCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { FilterVariant, SelectOption, RangeConfig } from "../tsgrid.types";
import { BOOLEAN_OPTIONS, hasFilterValue } from "../tsgrid.utils";

interface DataTableFilterProps {
  title: string;
  filterKey: string;
  variant: FilterVariant;
  options?: SelectOption[];
  range?: RangeConfig;
  values: string[];
  onChange: (filterKey: string, values: string[]) => void;
}

export function DataTableFilter({
  title,
  filterKey,
  variant,
  options,
  range,
  values,
  onChange,
}: DataTableFilterProps) {
  const hasValue = hasFilterValue(variant, values);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1 border-dashed">
          <PlusCircle className="h-3.5 w-3.5" />
          {title}
          {hasValue && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <FacetSummary
                variant={variant}
                options={options}
                range={range}
                values={values}
              />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          variant === "select" ||
            variant === "multiSelect" ||
            variant === "boolean"
            ? "w-[200px] p-0"
            : "w-[260px] p-3",
        )}
        align="start"
      >
        {variant === "select" || variant === "multiSelect" ? (
          <SelectFacet
            title={title}
            multi={variant === "multiSelect"}
            options={options ?? []}
            values={values}
            onChange={(v) => onChange(filterKey, v)}
          />
        ) : variant === "range" || variant === "number" ? (
          <RangeFacet
            range={range}
            values={values}
            onChange={(v) => onChange(filterKey, v)}
          />
        ) : variant === "date" || variant === "dateRange" ? (
          <DateFacet values={values} onChange={(v) => onChange(filterKey, v)} />
        ) : variant === "boolean" ? (
          <SelectFacet
            title={title}
            multi={false}
            options={BOOLEAN_OPTIONS}
            values={values}
            onChange={(v) => onChange(filterKey, v)}
          />
        ) : (
          <TextFacet values={values} onChange={(v) => onChange(filterKey, v)} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function FacetSummary({
  variant,
  options,
  range,
  values,
}: {
  variant: FilterVariant;
  options?: SelectOption[];
  range?: RangeConfig;
  values: string[];
}) {
  if (
    variant === "select" ||
    variant === "multiSelect" ||
    variant === "boolean"
  ) {
    if (values.length <= 2) {
      return (
        <div className="flex gap-1">
          {values.map((v) => {
            const opt = options?.find((o) => o.value === v);
            return (
              <Badge
                key={v}
                variant="secondary"
                className="rounded-sm px-1 text-xs font-normal"
              >
                {opt?.label ?? v}
              </Badge>
            );
          })}
        </div>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="rounded-sm px-1 text-xs font-normal"
      >
        {values.length} selected
      </Badge>
    );
  }

  if (variant === "text") {
    return (
      <Badge
        variant="secondary"
        className="max-w-[120px] truncate rounded-sm px-1 text-xs font-normal"
      >
        {values[0]}
      </Badge>
    );
  }

  const [a, b] = values;
  const unit = range?.unit ? ` ${range.unit}` : "";
  const label =
    a && b
      ? `${a} – ${b}${unit}`
      : a
        ? `≥ ${a}${unit}`
        : b
          ? `≤ ${b}${unit}`
          : "";
  return (
    <Badge variant="secondary" className="rounded-sm px-1 text-xs font-normal">
      {label}
    </Badge>
  );
}

function SelectFacet({
  title,
  multi,
  options,
  values,
  onChange,
}: {
  title: string;
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
    <Command>
      <CommandInput placeholder={title} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const isSelected = selected.has(option.value);
            return (
              <CommandItem
                key={option.value}
                onSelect={() => toggle(option.value)}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible",
                  )}
                >
                  <Check className="h-3 w-3" />
                </div>
                {option.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
        {selected.size > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => onChange([])}
                className="justify-center text-center"
              >
                Clear
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}

function RangeFacet({
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
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-full"
        onClick={() => apply("", "")}
      >
        Clear
      </Button>
    </div>
  );
}

function TextFacet({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [local, setLocal] = useState(values[0] ?? "");

  return (
    <div className="space-y-2">
      <Input
        autoFocus
        placeholder="Contains…"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChange(local ? [local] : []);
        }}
        className="h-8"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1"
          onClick={() => onChange(local ? [local] : [])}
        >
          Apply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => {
            setLocal("");
            onChange([]);
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

function DateFacet({
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
      <label className="block text-xs text-muted-foreground">From</label>
      <Input
        type="date"
        value={from}
        onChange={(e) => apply(e.target.value, to)}
        className="h-8"
      />
      <label className="block text-xs text-muted-foreground">To</label>
      <Input
        type="date"
        value={to}
        onChange={(e) => apply(from, e.target.value)}
        className="h-8"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-full"
        onClick={() => apply("", "")}
      >
        Clear
      </Button>
    </div>
  );
}
