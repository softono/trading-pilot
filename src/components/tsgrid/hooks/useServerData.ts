"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  ApiResult,
  PaginationInput,
  PaginationFlatInput,
  PaginationMeta,
  FilterState,
  FetcherDataType,
} from "../tsgrid.types";
import { toListQueryParams } from "../Pagination";
import {
  buildPaginationBody,
  listPayload,
  nextSort,
  queryErrorMessage,
  updateFilterState,
} from "../tsgrid.utils";

const RESERVED = new Set(["page", "limit", "sort", "order", "search"]);

interface UseServerDataOptions<T> {
  columns: ColumnDef<T, unknown>[];
  queryKey: readonly unknown[];
  fetcher:
    | ((body: PaginationInput) => Promise<ApiResult>)
    | ((params: PaginationFlatInput) => Promise<ApiResult>);
  fetcherDataType?: FetcherDataType;
  defaultLimit?: number;
  syncUrl?: boolean;
}

export interface ServerDataResult<T> {
  list: T[];
  pagination: PaginationMeta | undefined;
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
  filter: FilterState;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string | null;
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  toggleSort: (field: string) => void;
  setSearch: (v: string) => void;
  setFilter: (key: string, values: string[]) => void;
  resetFilters: () => void;
  columns: ColumnDef<T, unknown>[];
}

export function useServerData<T>({
  columns,
  queryKey,
  fetcher,
  fetcherDataType = "flat",
  defaultLimit = 20,
  syncUrl = true,
}: UseServerDataOptions<T>): ServerDataResult<T> {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initRef = useRef(false);

  const [page, setPage] = useState(() =>
    syncUrl ? Number(searchParams.get("page")) || 1 : 1,
  );
  const [limit, setLimitRaw] = useState(() =>
    syncUrl ? Number(searchParams.get("limit")) || defaultLimit : defaultLimit,
  );
  const [sort, setSort] = useState(() =>
    syncUrl ? searchParams.get("sort") || "" : "",
  );
  const [order, setOrder] = useState<"asc" | "desc">(() =>
    syncUrl ? (searchParams.get("order") === "asc" ? "asc" : "desc") : "desc",
  );
  const [search, setSearchRaw] = useState(() =>
    syncUrl ? searchParams.get("search") || "" : "",
  );
  const [filter, setFilterRaw] = useState<FilterState>(() => {
    if (!syncUrl) return {};
    const f: FilterState = {};
    searchParams.forEach((v, k) => {
      if (!RESERVED.has(k) && v) f[k] = v.split(",");
    });
    return f;
  });

  // sync state → URL
  useEffect(() => {
    if (!syncUrl) return;
    if (!initRef.current) {
      initRef.current = true;
      return;
    }
    const sp = new URLSearchParams();
    if (page > 1) sp.set("page", String(page));
    if (limit !== defaultLimit) sp.set("limit", String(limit));
    if (sort) sp.set("sort", sort);
    if (sort) sp.set("order", order);
    if (search) sp.set("search", search);
    for (const [k, vals] of Object.entries(filter)) {
      const joined = vals.filter((v) => v !== "").join(",");
      if (joined) sp.set(k, joined);
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [
    page,
    limit,
    sort,
    order,
    search,
    filter,
    pathname,
    defaultLimit,
    syncUrl,
  ]);

  const resetPage = useCallback(() => setPage(1), []);

  const handleSearchChange = useCallback(
    (v: string) => {
      setSearchRaw(v);
      resetPage();
    },
    [resetPage],
  );

  const handleFilterChange = useCallback(
    (key: string, values: string[]) => {
      setFilterRaw((prev) => updateFilterState(prev, key, values));
      resetPage();
    },
    [resetPage],
  );

  const handleResetFilters = useCallback(() => {
    setFilterRaw({});
    resetPage();
  }, [resetPage]);

  const handleLimitChange = useCallback(
    (v: number) => {
      setLimitRaw(v);
      resetPage();
    },
    [resetPage],
  );

  const toggleSort = useCallback(
    (field: string) => {
      const next = nextSort(sort, order, field);
      setSort(next.sort);
      setOrder(next.order);
      resetPage();
    },
    [sort, order, resetPage],
  );

  const body: PaginationInput = useMemo(
    () => buildPaginationBody({ page, limit, sort, order, search, filter }),
    [page, limit, sort, order, search, filter],
  );

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [...queryKey, { page, limit, sort, order, search, filter }],
    queryFn: () =>
      (
        fetcher as (
          arg: PaginationInput | PaginationFlatInput,
        ) => Promise<ApiResult>
      )(fetcherDataType === "default" ? body : toListQueryParams(body)),
    placeholderData: keepPreviousData,
  });

  const result = listPayload<T>(data);
  const list = useMemo(() => result?.list ?? [], [result]);
  const pagination = result?.pagination;

  const errorMessage = queryErrorMessage(isError, error);

  return {
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
    isError,
    errorMessage,
    setPage,
    setLimit: handleLimitChange,
    toggleSort,
    setSearch: handleSearchChange,
    setFilter: handleFilterChange,
    resetFilters: handleResetFilters,
    columns,
  };
}
