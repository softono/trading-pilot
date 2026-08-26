"use client";

import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  ApiResult,
  PaginationInput,
  PaginationMeta,
  FilterState,
} from "../tsgrid.types";
import {
  buildPaginationBody,
  listPayload,
  nextSort,
  queryErrorMessage,
  updateFilterState,
} from "../tsgrid.utils";

interface UseInfiniteServerDataOptions<T> {
  columns: ColumnDef<T, unknown>[];
  queryKey: readonly unknown[];
  fetcher: (body: PaginationInput) => Promise<ApiResult>;
  defaultLimit?: number;
}

export interface InfiniteServerDataResult<T> {
  list: T[];
  pagination: PaginationMeta | undefined;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
  filter: FilterState;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  errorMessage: string | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  toggleSort: (field: string) => void;
  setSearch: (v: string) => void;
  setFilter: (key: string, values: string[]) => void;
  resetFilters: () => void;
  columns: ColumnDef<T, unknown>[];
}

/**
 * Infinite-scroll sibling of `useServerData`. Same server contract
 * (POST list route returning `{ list, pagination }`), but pages are
 * appended via TanStack's `useInfiniteQuery`. No URL syncing — infinite
 * lists don't have a meaningful "current page" to share.
 */
export function useInfiniteServerData<T>({
  columns,
  queryKey,
  fetcher,
  defaultLimit = 20,
}: UseInfiniteServerDataOptions<T>): InfiniteServerDataResult<T> {
  const [limit] = useState(defaultLimit);
  const [sort, setSort] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [filter, setFilterRaw] = useState<FilterState>({});

  const setFilter = useCallback((key: string, values: string[]) => {
    setFilterRaw((prev) => updateFilterState(prev, key, values));
  }, []);

  const resetFilters = useCallback(() => setFilterRaw({}), []);

  const toggleSort = useCallback(
    (field: string) => {
      const next = nextSort(sort, order, field);
      setSort(next.sort);
      setOrder(next.order);
    },
    [sort, order],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...queryKey, { limit, sort, order, search, filter }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetcher(
        buildPaginationBody({
          page: pageParam,
          limit,
          sort,
          order,
          search,
          filter,
        }),
      ),
    getNextPageParam: (lastPage) => {
      const meta = listPayload(lastPage)?.pagination;
      if (!meta) return undefined;
      return meta.page < meta.pages ? meta.page + 1 : undefined;
    },
  });

  const list = useMemo(
    () => (data?.pages ?? []).flatMap((p) => listPayload<T>(p)?.list ?? []),
    [data],
  );

  const pagination = listPayload(
    data?.pages?.[data.pages.length - 1],
  )?.pagination;

  const errorMessage = queryErrorMessage(isError, error);

  return {
    list,
    pagination,
    limit,
    sort,
    order,
    search,
    filter,
    isLoading,
    isFetchingNextPage,
    isError,
    errorMessage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    toggleSort,
    setSearch,
    setFilter,
    resetFilters,
    columns,
  };
}
