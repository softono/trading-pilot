import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";
import {
  listExecutionsForUser,
  listExecutionsAdmin,
  executionSortMap,
} from "@/server/models/order-execution.repository";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";

export async function listMyExecutions(
  userId: string,
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listExecutionsForUser(userId);

  return Pagination.paginate(query, body, executionSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}

export async function listExecutionsAdminService(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listExecutionsAdmin();

  return Pagination.paginate(query, body, executionSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}
