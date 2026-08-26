"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tsgrid/DataTable";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";

const USERS_QUERY_KEY = ["user"] as const;
import type { UserProfile } from "@/modules/account/user.types";
import { showError, showSuccess } from "@/lib/message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useAuth } from "@/context/AdminAuthContext";
import PageHeader from "@/components/admin/PageHeader";
import { UserStatusBadge } from "@/components/badge/UserStatusBadge";
import { USER_STATUS_LABEL } from "@/modules/account/user.constants";

const STATUS_OPTIONS = Object.entries(USER_STATUS_LABEL).map(
  ([value, { label }]) => ({
    value,
    label,
  }),
);

function UserActionsDropdown({
  id,
  status,
  hasPermission,
  onView,
  onEdit,
  onDelete,
  onAction,
}: {
  id: string;
  status: string;
  hasPermission: (p: string) => boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (id: string, action: "activate" | "deactivate") => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasPermission("admin/user/view") && (
            <DropdownMenuItem onClick={() => onView(id)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
          )}
          {hasPermission("admin/user/update") && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {hasPermission("admin/user/action") && status === "inactive" && (
            <DropdownMenuItem onClick={() => onAction(id, "activate")}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Activate
            </DropdownMenuItem>
          )}
          {hasPermission("admin/user/action") && status === "active" && (
            <DropdownMenuItem onClick={() => onAction(id, "deactivate")}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Deactivate
            </DropdownMenuItem>
          )}
          {hasPermission("admin/user/delete") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete User"
        description="Are you sure you want to delete this user?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={() => onDelete(id)}
      />
    </>
  );
}

export default function AdminUserListPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { deleteItem: handleDelete } = useDeleteEntity(
    (id: string) => httpRequest<ApiResult>("delete", `/admin/users/${id}`),
    USERS_QUERY_KEY,
    "User",
  );

  const handleEdit = useCallback(
    (id: string) => router.push(`/admin/users/update/${id}`),
    [router],
  );

  const handleView = useCallback(
    (id: string) => router.push(`/admin/users/view/${id}`),
    [router],
  );

  const handleAction = useCallback(
    async (id: string, action: "activate" | "deactivate") => {
      const labels: Record<string, string> = {
        activate: "activated",
        deactivate: "deactivated",
      };
      try {
        await httpRequest<ApiResult>("patch", `admin/users/${id}`, { action });
        queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        showSuccess(`User ${labels[action]} successfully`);
      } catch {
        showError(`Failed to ${action} user`);
      }
    },
    [queryClient],
  );

  const columns: ColumnDef<UserProfile>[] = useMemo(() => {
    const cols: ColumnDef<UserProfile>[] = [
      {
        id: "first_name",
        header: "Name",
        meta: { sortable: true, filterVariant: "text" },
        cell: ({ row }) =>
          `${row.original.first_name ?? ""} ${row.original.last_name ?? ""}`.trim(),
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "phone",
        header: "Phone",
        meta: { sortable: true, filterVariant: "text" },
        cell: ({ row }) => row.original.phone || "-",
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
      {
        id: "created_at",
        header: "Created At",
        accessorKey: "created_at",
        meta: { sortable: true, filterVariant: "date" },
      },
    ];

    const hasAnyActionPermission =
      hasPermission("admin/user/view") ||
      hasPermission("admin/user/update") ||
      hasPermission("admin/user/delete") ||
      hasPermission("admin/user/action");

    if (hasAnyActionPermission) {
      cols.push({
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
          const id = String(user.id);
          return (
            <UserActionsDropdown
              id={id}
              status={user.status ?? "active"}
              hasPermission={hasPermission}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAction={handleAction}
            />
          );
        },
      });
    }

    return cols;
  }, [handleDelete, handleEdit, handleView, handleAction, hasPermission]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Users" showBackBtn={false} />
        {hasPermission("admin/user/create") && (
          <Button asChild>
            <Link href="/admin/users/create">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<UserProfile>
            columns={columns}
            queryKey={USERS_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/users", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
