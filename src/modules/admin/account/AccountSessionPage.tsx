"use client";
import { useState } from "react";
import { AccountBlock } from "@/modules/account/AccountBlock";
import { Button } from "@/components/ui/button";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/tsgrid/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ------------------ Logout Button ------------------ */

function LogoutButton({
  deviceId,
  queryKey,
}: {
  deviceId: string;
  queryKey: readonly unknown[];
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      httpRequest<ApiResult>("post", "admin/sessions/logout", {
        device_id: deviceId,
      }),
    onSuccess: async (response) => {
      if (response?.status === 1) {
        showSuccess(response.message || "Session successfully logged out");
        queryClient.invalidateQueries({ queryKey });
      } else {
        showError(response.message || "Failed to logout session");
      }
    },
    onError: () => {
      showError("Failed to logout session");
    },
  });
  const isLoading = mutation.status === "pending";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          onClick={() => setOpen(true)}
        >
          <LogOut className="w-4 h-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            Do you really want to logout this device?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={async () => {
              await mutation.mutateAsync();
              setOpen(false);
            }}
          >
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------ Device List ------------------ */

const QUERY_KEY = ["admin-account-devices"] as const;

export default function AdminAccountSessionPage() {
  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: "client",
      header: "Client",
    },
    {
      accessorKey: "ip",
      header: "IP",
    },
    {
      accessorKey: "last_activity",
      header: "Last Activity",
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) =>
        row.original?.action === "logout" ? (
          <LogoutButton
            deviceId={row.original.id as string}
            queryKey={QUERY_KEY}
          />
        ) : (
          "-"
        ),
    },
  ];

  return (
    <>
      <AccountBlock activeTab="Sessions" basePath="/admin" />
      <Card>
        <CardHeader>
          <CardTitle> Sessions List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            queryKey={QUERY_KEY}
            fetcher={(params) =>
              httpRequest<ApiResult>("get", "admin/account/session", params)
            }
            columns={columns}
            defaultLimit={10}
          />
        </CardContent>
      </Card>
    </>
  );
}
