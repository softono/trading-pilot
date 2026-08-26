"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tsgrid/DataTable";
import {
  CheckCircle,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  XCircle,
  Plus,
} from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { Blog } from "@/modules/blog/blog.types";
import { useAuth } from "@/context/AdminAuthContext";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import {
  BLOG_CATEGORIES,
  BLOG_STATUS_LABEL,
} from "@/modules/blog/blog.constants";
import { UserStatusBadge } from "@/components/badge/UserStatusBadge";
import config from "@/config";
import { showError, showSuccess } from "@/lib/message";
import { useQueryClient } from "@tanstack/react-query";

const BLOG_QUERY_KEY = ["blog"] as const;

const STATUS_OPTIONS = Object.entries(BLOG_STATUS_LABEL).map(
  ([value, info]) => ({ value, label: (info as { label: string }).label }),
);

const CATEGORY_OPTIONS = BLOG_CATEGORIES.map(
  ({ value, label }: { value: string; label: string }) => ({
    value,
    label,
  }),
);

function BlogActions({
  id,
  slug,
  status,
  hasPermission,
  onView,
  onEdit,
  onDelete,
  onAction,
}: {
  id: string;
  slug: string;
  status: string;
  hasPermission: (p: string) => boolean;
  onView: (slug: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (id: string, action: "activate" | "deactivate") => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {hasPermission("admin/blog/view") && (
            <DropdownMenuItem onClick={() => onView(slug)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
          )}

          {hasPermission("admin/blog/update") && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

          {hasPermission("admin/blog/action") && status === "inactive" && (
            <DropdownMenuItem onClick={() => onAction(id, "activate")}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Activate
            </DropdownMenuItem>
          )}

          {hasPermission("admin/blog/action") && status === "active" && (
            <DropdownMenuItem onClick={() => onAction(id, "deactivate")}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Deactivate
            </DropdownMenuItem>
          )}

          {hasPermission("admin/blog/delete") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Blog"
        description="Are you sure you want to delete this blog?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={() => onDelete(id)}
      />
    </>
  );
}

export default function AdminBlogListPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { deleteItem: handleDelete } = useDeleteEntity(
    (id: string) => httpRequest<ApiResult>("delete", `/admin/blogs/${id}`),
    BLOG_QUERY_KEY,
    "Blog",
  );

  const handleView = useCallback((slug: string) => {
    window.open(`${config.BASE_URL}/blog/${slug}`, "_blank");
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/blogs/update/${id}`);
    },
    [router],
  );

  const handleAction = useCallback(
    async (id: string, action: "activate" | "deactivate") => {
      const labels: Record<string, string> = {
        activate: "activated",
        deactivate: "deactivated",
      };

      try {
        await httpRequest<ApiResult>("patch", `admin/blogs/${id}`, { action });
        queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEY });
        showSuccess(`Blog ${labels[action]} successfully`);
      } catch {
        showError(`Failed to ${action} blog`);
      }
    },
    [queryClient],
  );

  const columns: ColumnDef<Blog>[] = useMemo(() => {
    const cols: ColumnDef<Blog>[] = [
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
        id: "category",
        accessorKey: "category",
        header: "Category",
        meta: {
          sortable: true,
          filterVariant: "multiSelect",
          options: CATEGORY_OPTIONS,
        },
      },
      {
        id: "status",
        accessorKey: "status",
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
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        meta: { sortable: true, filterVariant: "date" },
      },
    ];

    const hasActions =
      hasPermission("admin/blog/view") ||
      hasPermission("admin/blog/update") ||
      hasPermission("admin/blog/delete") ||
      hasPermission("admin/blog/action");

    if (hasActions) {
      cols.push({
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => (
          <BlogActions
            id={String(row.original.id)}
            slug={row.original.slug}
            status={row.original.status ?? "active"}
            hasPermission={hasPermission}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAction={handleAction}
          />
        ),
      });
    }

    return cols;
  }, [handleAction, handleDelete, handleEdit, handleView, hasPermission]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blogs</h1>

        {hasPermission("admin/blog/create") && (
          <Button asChild>
            <Link href="/admin/blogs/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Blog
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Management</CardTitle>
        </CardHeader>

        <CardContent>
          <DataTable<Blog>
            columns={columns}
            queryKey={BLOG_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/blogs", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
