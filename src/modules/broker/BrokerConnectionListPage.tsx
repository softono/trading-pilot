"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit, MoreHorizontal, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tsgrid/DataTable";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { TradingNav } from "@/components/common/TradingNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useQueryClient } from "@tanstack/react-query";
import type { BrokerConnection } from "@/modules/broker/broker.types";
import {
  BROKER_LABEL,
  CONNECTION_STATUS_LABEL,
} from "@/modules/broker/broker.constants";

const CONNECTIONS_QUERY_KEY = ["broker-connections"] as const;

function StatusBadge({ status }: { status: string }) {
  const entry =
    CONNECTION_STATUS_LABEL[status as keyof typeof CONNECTION_STATUS_LABEL] ??
    CONNECTION_STATUS_LABEL.unverified;
  return (
    <Badge variant={entry.variant} className="rounded-md">
      {entry.label}
    </Badge>
  );
}

export default function BrokerConnectionListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const { deleteItem: handleDelete } = useDeleteEntity<number>(
    (id: number) =>
      httpRequest<ApiResult>("delete", `broker-connections/${id}`),
    CONNECTIONS_QUERY_KEY,
    "Connection",
  );

  const handleVerify = useCallback(
    async (id: number) => {
      try {
        setVerifyingId(id);
        const res = await httpRequest<ApiResult>(
          "post",
          `broker-connections/${id}/verify`,
        );
        if (res?.status === 1) {
          showSuccess(res.message || "Connection verified");
        } else {
          showError(res.message || "Verification failed");
        }
      } catch (err) {
        const message = (err as { message?: string })?.message;
        showError(message || "Verification failed");
      } finally {
        setVerifyingId(null);
        queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
      }
    },
    [queryClient],
  );

  const columns: ColumnDef<BrokerConnection>[] = useMemo(
    () => [
      {
        id: "broker",
        accessorKey: "broker",
        header: "Broker",
        cell: ({ row }) =>
          BROKER_LABEL[row.original.broker] ?? row.original.broker,
      },
      { id: "mode", accessorKey: "mode", header: "Mode" },
      { id: "label", accessorKey: "label", header: "Label" },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "is_enabled",
        header: "Enabled",
        cell: ({ row }) => (row.original.is_enabled ? "Yes" : "No"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <RowActions
            connection={row.original}
            onEdit={() =>
              router.push(`/broker-connections/update/${row.original.id}`)
            }
            onVerify={() => handleVerify(row.original.id)}
            onDelete={() => handleDelete(row.original.id)}
            verifying={verifyingId === row.original.id}
          />
        ),
      },
    ],
    [router, handleVerify, handleDelete, verifyingId],
  );

  return (
    <>
      <TradingNav />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Broker Connections</h1>
        <Button asChild>
          <Link href="/broker-connections/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<BrokerConnection>
            columns={columns}
            queryKey={CONNECTIONS_QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "broker-connections", params)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}

function RowActions({
  connection,
  onEdit,
  onVerify,
  onDelete,
  verifying,
}: {
  connection: BrokerConnection;
  onEdit: () => void;
  onVerify: () => void;
  onDelete: () => void;
  verifying: boolean;
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
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onVerify} disabled={verifying}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verify
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Connection"
        description={`Delete the ${connection.broker} connection "${connection.label ?? ""}"? Any resting stop orders it placed will NOT be cancelled automatically.`}
        confirmText="Delete"
        destructive
        onConfirm={onDelete}
      />
    </>
  );
}
