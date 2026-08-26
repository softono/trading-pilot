"use client";
import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { Page } from "@/modules/page/page.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAGES_QUERY_KEY = ["pages"] as const;
import { DataTable } from "@/components/tsgrid/DataTable";
import { Button } from "@/components/ui/button";
import { CheckCircle, Edit, Eye, MoreHorizontal, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import config from "@/config";
import { useAuth } from "@/context/AdminAuthContext";
import { UserStatusBadge } from "@/components/badge/UserStatusBadge";
import { USER_STATUS_LABEL } from "@/modules/account/user.constants";
import { showError, showSuccess } from "@/lib/message";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_OPTIONS = Object.entries(USER_STATUS_LABEL).map(
  ([value, { label }]) => ({
    value,
    label,
  }),
);

function PageActionsDropdown({
  slug,
  id,
  status,
  hasPermission,
  onEdit,
  onAction,
}: {
  slug: string;
  id: string;
  status: string;
  hasPermission: (p: string) => boolean;
  onEdit: (id: string) => void;
  onAction: (id: string, action: "activate" | "deactivate") => void;
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {hasPermission("page/") && slug && (
            <DropdownMenuItem
              onClick={() =>
                window.open(`${config.BASE_URL}/page/${slug}`, "_blank")
              }
            >
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
          )}

          {hasPermission("admin/page/update") && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}

          {hasPermission("admin/page/action") && status === "inactive" && (
            <DropdownMenuItem onClick={() => onAction(id, "activate")}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Activate
            </DropdownMenuItem>
          )}

          {hasPermission("admin/page/action") && status === "active" && (
            <DropdownMenuItem onClick={() => onAction(id, "deactivate")}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Deactivate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default function PageList() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleAction = useCallback(
    async (id: string, action: "activate" | "deactivate") => {
      const labels: Record<string, string> = {
        activate: "activated",
        deactivate: "deactivated",
      };
      try {
        await httpRequest<ApiResult>("patch", `admin/page/${id}`, { action });
        queryClient.invalidateQueries({ queryKey: PAGES_QUERY_KEY });
        showSuccess(`Page ${labels[action]} successfully`);
      } catch {
        showError(`Failed to ${action} page`);
      }
    },
    [queryClient],
  );

  const columns: ColumnDef<Page>[] = useMemo(() => {
    const cols: ColumnDef<Page>[] = [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "slug",
        accessorKey: "slug",
        header: "Slug",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "status",
        header: "Status",
        meta: {
          sortable: true,
          filterVariant: "multiSelect",
          options: STATUS_OPTIONS,
        },
        cell: ({ row }) => (
          <UserStatusBadge status={row.original.status ?? "active"} />
        ),
      },
    ];

    const hasAnyActionPermission =
      hasPermission("page/") ||
      hasPermission("admin/page/update") ||
      hasPermission("admin/page/action");

    if (hasAnyActionPermission) {
      cols.push({
        id: "actions",
        header: "Action",
        enableHiding: false,
        cell: ({ row }) => {
          const data = row.original;
          return (
            <PageActionsDropdown
              slug={data.slug}
              id={String(data.id)}
              status={data.status ?? "active"}
              hasPermission={hasPermission}
              onEdit={(id) => router.push(`/admin/pages/update/${id}`)}
              onAction={(id, action) => handleAction(id, action)}
            />
          );
        },
      });
    }

    return cols;
  }, [handleAction, hasPermission, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<Page>
          columns={columns}
          queryKey={PAGES_QUERY_KEY}
          fetcher={(params) =>
            httpRequest<ApiResult>("get", "admin/page", params)
          }
        />
      </CardContent>
    </Card>
  );
}
