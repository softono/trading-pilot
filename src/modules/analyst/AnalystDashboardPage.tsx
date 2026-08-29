"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Users, Key, AlertTriangle, Loader2 } from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";

interface AnalystDashboardStats {
  signalsCount: number;
  subscriberCount: number;
  activeApiKeys: number;
  totalApiKeys: number;
  lastSignalReceivedAt: string | null;
  lastWebhookError: { message: string; occurredAt: string } | null;
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Radio;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalystDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analyst-dashboard"],
    queryFn: () =>
      httpRequest<ApiResult<AnalystDashboardStats>>("get", "analyst/dashboard"),
  });
  const stats = data?.status === 1 ? data.data : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Analyst Dashboard</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Radio}
          label="Signals Sent"
          value={stats?.signalsCount ?? 0}
        />
        <StatTile
          icon={Users}
          label="Subscribers"
          value={stats?.subscriberCount ?? 0}
        />
        <StatTile
          icon={Key}
          label="Active API Keys"
          value={`${stats?.activeApiKeys ?? 0} / ${stats?.totalApiKeys ?? 0}`}
        />
        <StatTile
          icon={AlertTriangle}
          label="Last Signal Received"
          value={stats?.lastSignalReceivedAt ?? "Never"}
        />
      </div>

      {stats?.lastWebhookError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Last Webhook Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{stats.lastWebhookError.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.lastWebhookError.occurredAt}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
