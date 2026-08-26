import type { ColumnDef } from "@tanstack/react-table";
import type {
  ApiResult,
  PaginationInput,
  PaginationMeta,
  FilterState,
  FilterVariant,
  SelectOption,
} from "./tsgrid.types";

export const BOOLEAN_OPTIONS: SelectOption[] = [
  { label: "True", value: "true" },
  { label: "False", value: "false" },
];

/** Filter key for a column: explicit filterKey, else accessorKey, else id. */
export function columnKey<T>(col: ColumnDef<T, unknown>): string {
  const c = col as { accessorKey?: string; id?: string };
  return col.meta?.filterKey || c.accessorKey || c.id || "";
}

/** Display title for a column: string header, else its key. */
export function columnTitle<T>(col: ColumnDef<T, unknown>): string {
  return typeof col.header === "string" ? col.header : columnKey(col);
}

const PAIR_VARIANTS: FilterVariant[] = ["range", "number", "date", "dateRange"];

/** Pair variants store [min, max] where either side may be empty. */
export function hasFilterValue(
  variant: FilterVariant,
  values: string[],
): boolean {
  return PAIR_VARIANTS.includes(variant)
    ? values.some(Boolean)
    : values.length > 0;
}

export function countActiveFilters(filter: FilterState): number {
  return Object.values(filter).filter((v) => v && v.length).length;
}

/** Sort cycle: none → asc → desc → none. */
export function nextSort(
  sort: string,
  order: "asc" | "desc",
  field: string,
): { sort: string; order: "asc" | "desc" } {
  if (sort !== field) return { sort: field, order: "asc" };
  if (order === "asc") return { sort: field, order: "desc" };
  return { sort: "", order: "desc" };
}

export function updateFilterState(
  prev: FilterState,
  key: string,
  values: string[],
): FilterState {
  const next = { ...prev };
  if (values.length) next[key] = values;
  else delete next[key];
  return next;
}

export interface ListQueryState {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
  filter: FilterState;
}

export function buildPaginationBody(state: ListQueryState): PaginationInput {
  const { page, limit, sort, order, search, filter } = state;
  return {
    page,
    limit,
    ...(sort ? { sortField: sort, sortDir: order } : {}),
    ...(search ? { search: { value: search } } : {}),
    ...(Object.keys(filter).length ? { filter } : {}),
  };
}

/** Unwraps the `{ list, pagination }` payload of a list ApiResult. */
export function listPayload<T>(
  result: ApiResult | undefined,
): { list?: T[]; pagination?: PaginationMeta } | undefined {
  return result?.data as
    | { list?: T[]; pagination?: PaginationMeta }
    | undefined;
}

export function queryErrorMessage(
  isError: boolean,
  error: unknown,
): string | null {
  if (!isError) return null;
  return (error instanceof Error && error.message) || "Failed to load data";
}
