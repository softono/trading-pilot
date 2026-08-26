"use client";

import { memo, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { httpRequest } from "@/lib/httpClient";
import { type ApiResult } from "@/types";

type Period = "day" | "month" | "year";

interface UserChartProps {
  period: Period;
}

type UserDonutChartProps = {
  active: number;
  inactive: number;
};

function getLast7Days() {
  const result: { key: string; display: string }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(d.getDate()).padStart(2, "0")}`,
      display: d.toLocaleDateString("en-US", {
        weekday: "short",
      }),
    });
  }

  return result;
}

function getLastNMonths(count: number) {
  const result: { key: string; display: string }[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      display: d.toLocaleDateString("en-US", {
        month: "short",
      }),
    });
  }

  return result;
}

function normalizeLabel(label: string, period: Period): string {
  const dayMatch = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(label);

  if (dayMatch) {
    const year = Number(dayMatch[1]);
    const month = Number(dayMatch[2]);
    const day = Number(dayMatch[3]);

    if (period === "day") {
      return `${year}-${String(month).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;
    }

    return `${year}-${String(month).padStart(2, "0")}`;
  }

  const monthMatch = /^\s*(\d{4})-(\d{2})\s*$/.exec(label);

  if (monthMatch) {
    return `${monthMatch[1]}-${monthMatch[2]}`;
  }

  const date = new Date(label);

  if (Number.isNaN(date.getTime())) {
    return label;
  }

  if (period === "day") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

const COLORS = ["var(--chart-5)", "var(--chart-3)"];

function UserDonutChartComponent({ active, inactive }: UserDonutChartProps) {
  const data = [
    {
      name: "Active",
      value: active,
    },
    {
      name: "Inactive",
      value: inactive,
    },
  ];

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export const UserDonutChart = memo(UserDonutChartComponent);

export function UserChart({ period }: UserChartProps) {
  const [data, setData] = useState<{
    labels: string[];
    data: number[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    /* eslint-disable react-hooks/set-state-in-effect -- resetting state at start of data fetch */
    setData(null);
    setError(null);
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    httpRequest<ApiResult>("get", "admin/dashboard/get-chart-user", {
      type: period,
    })
      .then((res) => {
        let expected: {
          key: string;
          display: string;
        }[] = [];

        if (period === "day") {
          expected = getLast7Days();
        } else if (period === "month") {
          expected = getLastNMonths(6);
        } else {
          expected = getLastNMonths(12);
        }

        const backendMap = new Map<string, number>();

        const rows = Array.isArray(res.data) ? res.data : [];
        const labels = rows.map(
          (item: { label: string; count: number }) => item.label,
        );
        const values = rows.map(
          (item: { label: string; count: number }) => item.count,
        );

        labels.forEach((label: string, index: number) => {
          backendMap.set(
            normalizeLabel(label, period),
            Number(values[index] ?? 0),
          );
        });

        const alignedLabels = expected.map((e) => e.display);

        const alignedData = expected.map((e) => backendMap.get(e.key) ?? 0);

        if (!cancelled) {
          setData({
            labels: alignedLabels,
            data: alignedData,
          });
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const chartData =
    data?.labels.map((label, index) => ({
      label,
      newUsers: data.data[index] ?? 0,
    })) ?? [];

  if (loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Loading chart...
      </div>
    );
  }

  if (error) {
    return <div className="py-10 text-center text-red-500">{error}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="label" fontSize={12} />

        <YAxis allowDecimals={false} />

        <Tooltip />

        <Legend />

        <Line
          type="monotone"
          dataKey="newUsers"
          name="New Users"
          stroke="var(--chart-5)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
