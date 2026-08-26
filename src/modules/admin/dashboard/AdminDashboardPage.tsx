"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";
import { UserDonutChart, UserChart } from "@/modules/admin/dashboard/userchart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/admin/PageHeader";

type UserSummary = {
  total: number;
  active: number;
  inactive: number;
};

function useCountUp(target: number | undefined, duration = 800) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof target !== "number") return;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * (target - 0) + 0));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return count;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "month" | "year">("year"); // dropdown selection

  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    setError(null);

    httpRequest<ApiResult>("get", "admin/dashboard")
      .then((res) => {
        const payload = res?.data;
        setSummary({
          total: payload?.totalUsers ?? payload?.total ?? 0,
          active: payload?.activeUsers ?? payload?.active ?? 0,
          inactive: payload?.inactiveUsers ?? payload?.inactive ?? 0,
        });
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalCount = useCountUp(summary?.total, 800);
  const activeCount = useCountUp(summary?.active, 800);
  const inactiveCount = useCountUp(summary?.inactive, 800);

  return (
    <>
      <div className="mb-2 flex items-center justify-between space-y-2">
        <PageHeader title="Dashboard" showBackBtn={false} />
      </div>

      {/* Cards */}
      <div className="mb-8">
        {loading ? (
          <div className="text-center py-10 text-[var(--color-muted-foreground)]">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-10 text-[var(--color-destructive)]">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <div className="bg-[var(--color-card)] border-b border-b-2 border-[var(--chart-3)] hover:border-[var(--chart-3)] shadow-lg rounded-lg h-full flex flex-col justify-between transition-colors duration-200">
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center mb-2">
                  <div className="flex items-center justify-center h-12 w-12 rounded bg-[var(--chart-3)/0.1] mr-4">
                    <Users className="h-7 w-7 text-[var(--chart-3)]" />
                  </div>
                  <h4 className="mb-0 text-3xl font-bold">
                    {totalCount.toLocaleString()}
                  </h4>
                </div>
                <p className="mb-0 text-sm">Total Users</p>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-[var(--color-card)] border-b border-b-2 border-[var(--chart-5)] hover:border-[var(--chart-5)] shadow-lg rounded-lg h-full flex flex-col justify-between transition-colors duration-200">
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center mb-2">
                  <div className="flex items-center justify-center h-12 w-12 rounded bg-[var(--chart-5)/0.1] mr-4">
                    <UserCheck className="h-7 w-7 text-[var(--chart-5)]" />
                  </div>
                  <h4 className="mb-0 text-3xl font-bold">
                    {activeCount.toLocaleString()}
                  </h4>
                </div>
                <p className="mb-0 text-sm">Active Users</p>
              </div>
            </div>

            {/* Inactive Users */}
            <div className="bg-[var(--color-card)] border-b border-b-2 border-[var(--color-destructive)] hover:border-[var(--color-destructive)] shadow-lg rounded-lg h-full flex flex-col justify-between transition-colors duration-200">
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center mb-2">
                  <div className="flex items-center justify-center h-12 w-12 rounded bg-[var(--color-destructive)/0.1] mr-4">
                    <UserX className="h-7 w-7 text-[var(--color-destructive)]" />
                  </div>
                  <h4 className="mb-0 text-3xl font-bold">
                    {inactiveCount.toLocaleString()}
                  </h4>
                </div>
                <p className="mb-0 text-sm">Inactive Users</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          {/* Donut chart */}
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Active/Inactive Users</CardTitle>
            </CardHeader>
            <CardContent className="ps-2">
              {summary ? (
                <UserDonutChart
                  active={summary.active}
                  inactive={summary.inactive}
                />
              ) : (
                <div className="text-center py-10 text-muted">
                  Loading chart...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line chart */}
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>New Users</CardTitle>
              <Select
                value={period}
                onValueChange={(val) =>
                  setPeriod(val as "day" | "month" | "year")
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 6 Months</SelectItem>
                  <SelectItem value="year">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="ps-2">
              <UserChart period={period} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
