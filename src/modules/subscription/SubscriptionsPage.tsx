"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tsgrid/DataTable";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import type { Subscription } from "@/modules/subscription/subscription.types";

const SUBSCRIPTIONS_QUERY_KEY = ["my-subscriptions"] as const;

export default function SubscriptionsPage() {
  const { deleteItem: handleUnsubscribe } = useDeleteEntity<string>(
    (analystId: string) =>
      httpRequest<ApiResult>("delete", `subscriptions/${analystId}`),
    SUBSCRIPTIONS_QUERY_KEY,
    "Subscription",
  );

  const columns: ColumnDef<Subscription>[] = useMemo(
    () => [
      {
        id: "analyst_name",
        accessorKey: "analyst_name",
        header: "Analyst",
        cell: ({ row }) => (
          <Link
            href={`/analysts/${row.original.analyst_slug}`}
            className="text-primary hover:underline"
          >
            {row.original.analyst_name}
          </Link>
        ),
      },
      {
        id: "started_at",
        accessorKey: "started_at",
        header: "Subscribed On",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleUnsubscribe(row.original.analyst_id)}
          >
            Unsubscribe
          </Button>
        ),
      },
    ],
    [handleUnsubscribe],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Subscriptions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscribed Analysts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Subscription>
            columns={columns}
            queryKey={SUBSCRIPTIONS_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "subscriptions", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
