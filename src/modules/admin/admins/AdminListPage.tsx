"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tsgrid/DataTable";
import { useMemo, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import type { User } from "@/modules/account/user.types";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
const ADMIN_QUERY_KEY = ["admins"] as const;
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
import { useQueryClient } from "@tanstack/react-query";
import { showError, showSuccess } from "@/lib/message";
import { UserStatusBadge } from "@/components/badge/UserStatusBadge";
import { USER_STATUS_LABEL } from "@/modules/account/user.constants";

const STATUS_OPTIONS = Object.entries(USER_STATUS_LABEL).map(
  ([value, { label }]) => ({
    value,
    label,
  }),
);

function AdminActionsDropdown({
  id,
  status,
  hasPermission,
  onView,
  onEdit,
  onPermission,
  onDelete,
  onAction,
}: {
  id: string;
  status: string;
  hasPermission: (p: string) => boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onPermission: (id: string) => void;
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
          {hasPermission("admin/admin/view") && (
            <DropdownMenuItem onClick={() => onView(id)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
          )}
          {hasPermission("admin/admin/update") && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          {hasPermission("admin/admin/update") && (
            <DropdownMenuItem onClick={() => onPermission(id)}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Permission
            </DropdownMenuItem>
          )}{" "}
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
          {hasPermission("admin/admin/delete") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Admin"
        description="Are you sure you want to delete this admin?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={() => onDelete(id)}
      />
    </>
  );
}

export default function Admins() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { deleteItem: handleDelete } = useDeleteEntity(
    (id: string) => httpRequest<ApiResult>("delete", `admin/admins/${id}`),
    ADMIN_QUERY_KEY,
    "Admin",
  );
  const { hasPermission } = useAuth();

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/admins/update/${id}`);
    },
    [router],
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/admin/admins/view/${id}`);
    },
    [router],
  );

  const handlePermission = useCallback(
    (id: string) => {
      router.push(`/admin/admins/permission?id=${id}`);
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
        await httpRequest<ApiResult>("patch", `admin/admins/${id}`, { action });
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
        showSuccess(`admin ${labels[action]} successfully`);
      } catch {
        showError(`Failed to ${action} admin`);
      }
    },
    [queryClient],
  );
  const columns: ColumnDef<User>[] = useMemo(() => {
    const cols: ColumnDef<User>[] = [
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
    ];

    const hasAnyActionPermission =
      hasPermission("admin/admin/view") ||
      hasPermission("admin/admin/update") ||
      hasPermission("admin/admin/delete");

    if (hasAnyActionPermission) {
      cols.push({
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => {
          const id = String(row.original.id);
          return (
            <AdminActionsDropdown
              id={id}
              status={row.original.status ?? "active"}
              hasPermission={hasPermission}
              onView={handleView}
              onEdit={handleEdit}
              onPermission={handlePermission}
              onDelete={handleDelete}
              onAction={handleAction}
            />
          );
        },
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDelete, handleEdit, handleView, handlePermission, hasPermission]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Admins" showBackBtn={false} />
        {hasPermission("admin/admin/create") && (
          <Button asChild>
            <Link href="/admin/admins/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<User>
            columns={columns}
            queryKey={ADMIN_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/admins", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
