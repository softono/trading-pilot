"use client";
import { useMemo } from "react";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { AccountBlock } from "@/modules/account/AccountBlock";
import { DataTable } from "@/components/tsgrid/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

export default function UserActivityLog() {
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Date",
      },
      {
        accessorKey: "client",
        header: "Device",
      },

      {
        accessorKey: "type",
        header: "Type",
      },
    ],
    [],
  );

  return (
    <>
      <AccountBlock activeTab="Activity" />
      <div className="flex-1 sm:px-10 mt-6 sm:mt-9">
        <div className="bg-card rounded-2xl border shadow-sm">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold ">Activity / List</h2>
          </div>
          <div className="px-3 sm:px-6 pb-4">
            <DataTable
              queryKey={["user-activity"]}
              fetcher={(params) =>
                httpRequest<ApiResult>("get", "account/user-activity", params)
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
