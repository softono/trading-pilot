"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  PaginationInput,
  PaginationFlatInput,
} from "./pagination.validator";

/**
 * Serializes a PaginationInput into query params for GET list endpoints:
 * page/limit/sortField/sortDir/search stay flat, filter is base64-JSON
 * (the one field with arbitrary nested shape).
 */
export function toListQueryParams(body: PaginationInput): PaginationFlatInput {
  const params: PaginationFlatInput = {};

  if (body.page) params.page = String(body.page);
  if (body.limit) params.limit = String(body.limit);
  if (body.sortField) {
    params.sortField = body.sortField;
    if (body.sortDir) params.sortDir = body.sortDir;
  }
  if (body.search?.value) params.search = body.search.value;
  if (body.filter && Object.keys(body.filter).length) {
    params.filter = btoa(JSON.stringify(body.filter));
  }

  return params;
}

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  count: string;
  limit: number;
  pageSizeOptions: number[];
  onPage: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function buildWindow(page: number, lastPage: number): (number | "ellipsis")[] {
  const items: (number | "ellipsis")[] = [];

  if (page > 4) items.push(1, "ellipsis");

  for (let i = 3; i >= 1; i--) {
    if (page - i > 0) items.push(page - i);
  }

  items.push(page);

  for (let i = 1; i <= 3; i++) {
    if (page + i <= lastPage) items.push(page + i);
  }

  if (lastPage > page + 3) items.push("ellipsis", lastPage);

  return items;
}

const circle =
  "flex w-10 h-10 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300";

export function Pagination({
  page,
  pages,
  total,
  count,
  limit,
  pageSizeOptions,
  onPage,
  onLimitChange,
}: PaginationProps) {
  if (!total) return null;

  const window = buildWindow(page, pages);
  const atStart = page <= 1;
  const atEnd = page >= pages;

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">Rows</span>
        <Select
          value={String(limit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{count}</p>

      <nav aria-label="Page navigation">
        <ul className="flex flex-wrap items-center justify-center gap-2">
          <li>
            <button
              type="button"
              aria-label="Previous"
              disabled={atStart}
              onClick={() => onPage(page - 1)}
              className={cn(
                circle,
                "border border-border",
                atStart
                  ? "pointer-events-none opacity-50"
                  : "hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </li>

          {window.map((item, idx) =>
            item === "ellipsis" ? (
              <li key={`e-${idx}`}>
                <span className="flex h-10 w-10 items-center justify-center text-muted-foreground">
                  …
                </span>
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPage(item)}
                  aria-current={item === page ? "page" : undefined}
                  className={cn(
                    circle,
                    item === page
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {item}
                </button>
              </li>
            ),
          )}

          <li>
            <button
              type="button"
              aria-label="Next"
              disabled={atEnd}
              onClick={() => onPage(page + 1)}
              className={cn(
                circle,
                "border border-border",
                atEnd
                  ? "pointer-events-none opacity-50"
                  : "hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
