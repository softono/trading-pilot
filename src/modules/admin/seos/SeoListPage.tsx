"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Edit,
  MoreHorizontal,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { SeoMeta } from "@/types/admin";
import { DataTable } from "@/components/tsgrid/DataTable";

const SEO_QUERY_KEY = ["seoMetas"];
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppConfig from "@/config";
import { showError, showSuccess } from "@/lib/message";
import { useAuth } from "@/context/AdminAuthContext";
import PageHeader from "@/components/admin/PageHeader";

const SITEMAP_OPTIONS = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

function SeoStatusBadge({
  sitemap_enable,
}: {
  sitemap_enable: SeoMeta["sitemap_enable"];
}) {
  const isEnabled = sitemap_enable === 1;
  return (
    <Badge variant={isEnabled ? "success" : "destructive"}>
      {isEnabled ? "Active" : "Inactive"}
    </Badge>
  );
}

function SeoActionsDropdown({
  id,
  sitemap_enable,
  hasPermission,
  onEdit,
  onDelete,
  onAction,
}: {
  id: string;
  sitemap_enable: SeoMeta["sitemap_enable"];
  hasPermission: (p: string) => boolean;
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
          {/* Status actions (Activate/Deactivate) */}
          {hasPermission("admin/seo/action") && sitemap_enable === 1 && (
            <DropdownMenuItem onClick={() => onAction(id, "deactivate")}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Deactivate
            </DropdownMenuItem>
          )}
          {hasPermission("admin/seo/action") && sitemap_enable === 0 && (
            <DropdownMenuItem onClick={() => onAction(id, "activate")}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Activate
            </DropdownMenuItem>
          )}

          {hasPermission("admin/seo/update") && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          {hasPermission("admin/seo/delete") && (
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
        title="Delete SEO Meta"
        description="Are you sure you want to delete this SEO meta?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={() => onDelete(id)}
      />
    </>
  );
}

export default function SeoMetaListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { deleteItem: handleDelete } = useDeleteEntity(
    (id: string) => httpRequest<ApiResult>("delete", `admin/seos/${id}`),
    SEO_QUERY_KEY,
    "SEO Meta",
  );
  const [isSitemapDialogOpen, setIsSitemapDialogOpen] = useState(false);
  const [lastSitemapResult, setLastSitemapResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/seos/update/${id}`);
    },
    [router],
  );

  const queryClient = useQueryClient();

  const handleAction = useCallback(
    async (id: string, action: "activate" | "deactivate") => {
      const labels: Record<string, string> = {
        activate: "activated",
        deactivate: "deactivated",
      };

      try {
        await httpRequest<ApiResult>("patch", `admin/seos/${id}`, { action });
        queryClient.invalidateQueries({ queryKey: SEO_QUERY_KEY });
        showSuccess(`SEO ${labels[action]} successfully`);
      } catch (e) {
        console.error(e);
        showError(`Failed to ${action} seo sitemap`);
      }
    },
    [queryClient],
  );

  const handleUpdateSitemap = useCallback(async () => {
    try {
      const result = await httpRequest<ApiResult>(
        "post",
        "admin/seos/sitemap",
        {},
      );
      if (result.status === 1) {
        showSuccess(
          `Sitemap updated! ${result.data?.entryCount || 0} URLs from seo_meta table`,
        );
        setLastSitemapResult(result.data);
      } else {
        showError(result.message || "Update failed");
      }
      setIsSitemapDialogOpen(false);
    } catch (error) {
      console.error("Error updating sitemap:", error);
      showError("Failed to update sitemap");
    }
  }, []);

  const columns: ColumnDef<SeoMeta>[] = useMemo(() => {
    const cols: ColumnDef<SeoMeta>[] = [
      {
        id: "url",
        accessorKey: "url",
        header: "Url",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "keyword",
        accessorKey: "keyword",
        header: "Keyword",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "sitemap_enable",
        header: "Sitemap",
        meta: {
          sortable: true,
          filterVariant: "multiSelect",
          options: SITEMAP_OPTIONS,
        },
        cell: ({ row }) => (
          <SeoStatusBadge sitemap_enable={row.original.sitemap_enable} />
        ),
      },
    ];

    const hasAnyActionPermission =
      hasPermission("admin/seo/update") || hasPermission("admin/seo/delete");

    if (hasAnyActionPermission) {
      cols.push({
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => {
          const id = String(row.original.id);
          return (
            <SeoActionsDropdown
              id={id}
              sitemap_enable={row.original.sitemap_enable}
              hasPermission={hasPermission}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAction={handleAction}
            />
          );
        },
      });
    }

    return cols;
  }, [handleDelete, handleEdit, handleAction, hasPermission]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Seo Meta" showBackBtn={false} />

        <div className="flex gap-2 justify-end">
          <Dialog
            open={isSitemapDialogOpen}
            onOpenChange={setIsSitemapDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>SiteMap</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sitemap Management</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sitemap-url" className="mb-4">
                    Sitemap URL
                  </Label>
                  <Input
                    id="sitemap-url"
                    value={`${AppConfig.BASE_URL}/sitemap.xml`}
                    readOnly
                  />
                </div>
                {lastSitemapResult && (
                  <div className="p-3 bg-green-50 border rounded text-sm text-green-800">
                    Last update:{" "}
                    {lastSitemapResult.entryCount as React.ReactNode} URLs
                    generated
                  </div>
                )}
                <Button onClick={handleUpdateSitemap} className="w-full">
                  Update Sitemap
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {hasPermission("admin/seo/create") && (
            <Button asChild>
              <Link href="/admin/seos/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Seo Meta
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seo Meta Management</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<SeoMeta>
            columns={columns}
            queryKey={SEO_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/seos", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
