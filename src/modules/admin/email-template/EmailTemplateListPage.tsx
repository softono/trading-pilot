"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import type { EmailTemplate } from "@/modules/admin/email-template/email-template.types";

const EMAIL_TEMPLATE_QUERY_KEY = ["email_template"] as const;
import { DataTable } from "@/components/tsgrid/DataTable";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AdminAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function EmailTemplateActionsDropdown({
  id,
  hasPermission,
  onView,
  onEdit,
}: {
  id: string;
  hasPermission: (p: string) => boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasPermission("admin/email_template/view") && (
          <DropdownMenuItem onClick={() => onView(id)}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
        )}
        {hasPermission("admin/email_template/update") && (
          <DropdownMenuItem onClick={() => onEdit(id)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function EmailTemplateListPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  const columns: ColumnDef<EmailTemplate>[] = useMemo(() => {
    const cols: ColumnDef<EmailTemplate>[] = [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "subject",
        accessorKey: "subject",
        header: "Subject",
        meta: { sortable: true, filterVariant: "text" },
      },
    ];

    const hasAnyActionPermission =
      hasPermission("admin/email_template/view") ||
      hasPermission("admin/email_template/update");

    if (hasAnyActionPermission) {
      cols.push({
        id: "actions",
        header: "Action",
        enableHiding: false,
        cell: ({ row }) => {
          const id = String(row.original.id);
          return (
            <EmailTemplateActionsDropdown
              id={id}
              hasPermission={hasPermission}
              onView={(id) => router.push(`/admin/email-templates/view/${id}`)}
              onEdit={(id) =>
                router.push(`/admin/email-templates/update/${id}`)
              }
            />
          );
        },
      });
    }

    return cols;
  }, [hasPermission, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<EmailTemplate>
          columns={columns}
          queryKey={EMAIL_TEMPLATE_QUERY_KEY}
          fetcher={(params) =>
            httpRequest<ApiResult>("get", "admin/email-template", params)
          }
        />
      </CardContent>
    </Card>
  );
}
