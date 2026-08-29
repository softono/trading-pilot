import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";
import {
  listPublicSignals,
  getPublicSignalById,
  signalSortMap,
} from "@/server/models/signal.repository";
import { isSubscribed } from "@/server/modules/subscription/subscription.service";
import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";

export async function listPublicSignalsService(
  body: PaginationInput,
  tz: string,
  analystId?: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();
  const query = listPublicSignals(search || undefined, analystId);

  return Pagination.paginate(query, body, signalSortMap, {
    defaultSort: { field: "published_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      published_at: row.published_at
        ? dateTimeFormat(row.published_at as Date, tz)
        : null,
    }),
  });
}

// Locked = not visible to a non-subscriber — the whole point of the gate (§ Q6 decision). Omitted
// server-side, never sent to the client and CSS-hidden, so the numbers can't be scraped from the
// page source.
const LOCKED_FIELDS = ["entry", "stop_loss", "targets"] as const;

export async function getPublicSignalDetailService(
  id: number,
  viewerUserId: string | undefined,
  tz: string,
): Promise<ApiResult> {
  const row = await getPublicSignalById(id);
  if (!row) {
    return { http_status: 404, status: 0, message: "Signal not found" };
  }

  const subscribed = await isSubscribed(viewerUserId, row.analyst_id);

  const data: Record<string, unknown> = {
    ...row,
    is_subscribed: subscribed,
    detected_at: row.detected_at
      ? dateTimeFormat(row.detected_at as Date, tz)
      : null,
    published_at: row.published_at
      ? dateTimeFormat(row.published_at as Date, tz)
      : null,
    closed_at: row.closed_at ? dateTimeFormat(row.closed_at as Date, tz) : null,
  };

  if (!subscribed) {
    for (const field of LOCKED_FIELDS) delete data[field];
  }

  return {
    http_status: 200,
    status: 1,
    message: "Signal retrieved successfully",
    data,
  };
}
