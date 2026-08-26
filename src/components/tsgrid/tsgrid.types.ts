import type { RowData } from "@tanstack/react-table";
import type { ApiResult } from "@/types";
import type {
  PaginationInput,
  PaginationFlatInput,
} from "@/components/tsgrid/pagination.validator";

// ── Wire contract ──────────────────────────────────────────────────
// Re-exported from the host app's canonical sources so the tsgrid folder has
// a single contract import surface (./types). When extracting tsgrid into its
// own package, swap these re-exports for self-contained interface definitions.
export type { ApiResult } from "@/types";
export type {
  PaginationInput,
  PaginationFlatInput,
} from "@/components/tsgrid/pagination.validator";

// ── Fetcher contract ───────────────────────────────────────────────
// "flat" (default): the fetcher receives flat query params built with
// toListQueryParams (page/limit/sortField/sortDir/search + base64 filter)
// for GET list endpoints. "default": the fetcher receives the raw
// nested PaginationInput body, for POST list endpoints.
export type FetcherDataType = "flat" | "default";

export type ListFetcherProps =
  | {
      fetcherDataType?: "flat";
      fetcher: (params: PaginationFlatInput) => Promise<ApiResult>;
    }
  | {
      fetcherDataType: "default";
      fetcher: (body: PaginationInput) => Promise<ApiResult>;
    };

// ── Filter taxonomy ────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  count: string;
}

export type FilterVariant =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect";

export interface SelectOption {
  label: string;
  value: string;
}

export interface RangeConfig {
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

/**
 * Filter state: column key → selected values.
 * - select / multiSelect → list of chosen values (IN)
 * - range / number       → [min, max] (between)
 * - date / dateRange     → [from, to] (between)
 * - text                 → [value] (contains)
 * - boolean              → ["true"] / ["false"]
 */
export type FilterState = Record<string, string[]>;

// ── Column meta ────────────────────────────────────────────────────

export interface ServerColumnMeta {
  sortable?: boolean;
  filterVariant?: FilterVariant;
  filterKey?: string;
  options?: SelectOption[];
  range?: RangeConfig;
  align?: "left" | "center" | "right";
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ColumnMeta<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TData extends RowData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TValue,
  > extends ServerColumnMeta {}
}
