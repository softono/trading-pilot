import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";
import {
  listSignalsAdmin,
  signalSortMap,
} from "@/server/models/signal.repository";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";

export async function listSignalsAdminService(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();
  const query = listSignalsAdmin(search || undefined);

  return Pagination.paginate(query, body, signalSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      published_at: row.published_at
        ? dateTimeFormat(row.published_at as Date, tz)
        : null,
      created_at: dateTimeFormat(row.created_at as Date, tz),
    }),
  });
}
