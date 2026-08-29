"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserCheck,
  TrendingUp,
  Radio,
  AlertTriangle,
  XOctagon,
} from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";

interface TradingStats {
  analystsCount: number;
  pendingApplications: number;
  signalsToday: number;
  failedDeliveries: number;
  failedExecutions: number;
}

function StatTile({
  icon: Icon,
  label,
  value,
  href,
  destructive,
}: {
  icon: typeof UserCheck;
  label: string;
  value: number;
  href: string;
  destructive?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded ${
              destructive && value > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TradingDashboardStats() {
  const [stats, setStats] = useState<TradingStats | null>(null);

  useEffect(() => {
    httpRequest<ApiResult<TradingStats>>("get", "admin/dashboard/trading")
      .then((res) => setStats(res.status === 1 ? (res.data ?? null) : null))
      .catch(() => setStats(null));
  }, []);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Trading Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile
            icon={UserCheck}
            label="Analysts"
            value={stats?.analystsCount ?? 0}
            href="/admin/analysts"
          />
          <StatTile
            icon={TrendingUp}
            label="Pending Applications"
            value={stats?.pendingApplications ?? 0}
            href="/admin/analyst-applications"
          />
          <StatTile
            icon={Radio}
            label="Signals Today"
            value={stats?.signalsToday ?? 0}
            href="/admin/signals"
          />
          <StatTile
            icon={AlertTriangle}
            label="Failed Deliveries"
            value={stats?.failedDeliveries ?? 0}
            href="/admin/signals"
            destructive
          />
          <StatTile
            icon={XOctagon}
            label="Failed Executions"
            value={stats?.failedExecutions ?? 0}
            href="/admin/executions"
            destructive
          />
        </div>
      </CardContent>
    </Card>
  );
}
