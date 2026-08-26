"use client";
import { useMemo, useState } from "react";
import { AccountBlock } from "@/modules/account/AccountBlock";
import { Button } from "@/components/ui/button";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResponse, ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/tsgrid/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

const QUERY_KEY = ["user-sessions"] as const;

export default function SessionList() {
  const queryClient = useQueryClient();
  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);

  const logoutMutation = useMutation({
    mutationFn: (deviceId: string) =>
      httpRequest<ApiResponse>("post", "account/session/logout", {
        device_id: deviceId,
      }),
    onSuccess: (res) => {
      if (res.status === 1) {
        showSuccess(res.message || "Session logged out");
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      } else {
        showError(res.message || "Failed");
      }
    },
    onError: () => {
      showError("Failed to logout session");
    },
  });

  const handleLogoutDevice = (deviceId: string) => {
    setPendingDeviceId(deviceId);
  };

  const confirmLogout = () => {
    if (!pendingDeviceId) return;
    logoutMutation.mutate(pendingDeviceId);
  };

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => [
      {
        accessorKey: "client",
        header: "Client",
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleLogoutDevice(row.original.id as string)}
            >
              <LogOut className="w-4 h-4 text-destructive" />
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    [],
  );

  return (
    <>
      <ConfirmationDialog
        open={!!pendingDeviceId}
        onOpenChange={(open) => !open && setPendingDeviceId(null)}
        title="Logout session"
        description="This session will be signed out. It will need to sign in again to access your account."
        confirmText="Logout"
        onConfirm={confirmLogout}
        destructive
      />
      <AccountBlock activeTab="Sessions" />
      <div className="flex-1 sm:px-10 mt-6 sm:mt-9">
        <div className="bg-card rounded-2xl border shadow-sm">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-card-foreground">
              Session List
            </h2>
          </div>
          <div className="px-3 sm:px-6 pb-4">
            <DataTable
              queryKey={QUERY_KEY}
              fetcher={(params) =>
                httpRequest<ApiResult>("get", "account/session", params)
              }
              columns={columns}
              defaultLimit={10}
            />
          </div>
        </div>
      </div>
    </>
  );
}
