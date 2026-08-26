"use client";

import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";

const DEVICES_QUERY_KEY = ["devices"] as const;
import type { UserSession } from "@/modules/account/user.types";

import { DataTable } from "@/components/tsgrid/DataTable";
import { Button } from "@/components/ui/button";
import { LogOut, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { showError, showSuccess } from "@/lib/message";
import { useAuth } from "@/context/AdminAuthContext";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DeviceActionsDropdown({ deviceId }: { deviceId: string }) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      httpRequest<ApiResult>("post", "admin/sessions/logout", {
        device_id: deviceId,
      }),
    onSuccess: (response) => {
      if (response?.status === 1) {
        showSuccess(response.message || "Device successfully logged out");
      } else {
        showError(response.message || "Failed to logout device");
      }
    },
    onError: () => {
      showError("Failed to logout device");
    },
  });
  const isLoading = mutation.status === "pending";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
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
                setLogoutOpen(false);
              }}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DevicePage() {
  const { hasPermission } = useAuth();

  const columns: ColumnDef<UserSession>[] = useMemo(() => {
    const cols: ColumnDef<UserSession>[] = [
      {
        id: "created_at",
        header: "Created",
        accessorKey: "created_at",
        meta: { sortable: true, filterVariant: "date" },
      },
      {
        id: "first_name",
        header: "Name",
        cell: ({ row }) =>
          `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim() ||
          "-",
      },
      {
        id: "email",
        header: "Email",
        meta: { sortable: true, filterVariant: "text" },
        cell: ({ row }) => row.original.email || "-",
      },
      {
        id: "role",
        header: "User Type",
        cell: ({ row }) =>
          (row.original as unknown as Record<string, unknown>).role ??
          (row.original as unknown as Record<string, unknown>).userType ??
          "-",
      },
      {
        id: "user_agent",
        header: "Client",
        meta: { sortable: true, filterVariant: "text" },
        cell: ({ row }) => row.original.user_agent || "-",
      },
      {
        id: "ip_address",
        header: "IP",
        meta: { sortable: true, filterVariant: "text" },
        cell: ({ row }) => row.original.ip_address || "-",
      },
    ];

    if (hasPermission("admin/session/logout")) {
      cols.push({
        id: "actions",
        header: "Action",
        enableHiding: false,
        cell: ({ row }) => (
          <DeviceActionsDropdown deviceId={String(row.original.id)} />
        ),
      });
    }

    return cols;
  }, [hasPermission]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Management</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<UserSession>
          columns={columns}
          queryKey={DEVICES_QUERY_KEY}
          fetcher={(params) =>
            httpRequest<ApiResult>("get", "admin/sessions", params)
          }
        />
      </CardContent>
    </Card>
  );
}
