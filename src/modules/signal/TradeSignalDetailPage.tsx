"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { showError, showSuccess } from "@/lib/message";
import { useAuth } from "@/context/AuthContext";
import { SIGNAL_STATUS_LABEL } from "@/modules/signal/signal.constants";
import type { SignalDetail } from "@/modules/signal/signal.types";

export default function TradeSignalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [subscribing, setSubscribing] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["trade-signal", id],
    queryFn: () =>
      httpRequest<ApiResult<SignalDetail>>("get", `trade-signals/${id}`),
    enabled: !!id,
  });

  const signal = data?.status === 1 ? data.data : undefined;

  const handleSubscribe = async () => {
    if (!signal) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/trade-signals/${id}`);
      return;
    }
    try {
      setSubscribing(true);
      const res = await httpRequest<ApiResult>("post", "subscriptions", {
        analyst_id: signal.analyst_id,
      });
      if (res?.status === 1) {
        showSuccess("Subscribed — targets unlocked");
        queryClient.invalidateQueries({ queryKey: ["trade-signal", id] });
      } else {
        showError(res.message || "Failed to subscribe");
      }
    } catch {
      showError("Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-3 sm:px-6 lg:px-15 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !signal) {
    return (
      <div className="px-3 sm:px-6 lg:px-15 py-6">
        <p className="text-destructive">Signal not found.</p>
      </div>
    );
  }

  const statusEntry =
    SIGNAL_STATUS_LABEL[signal.status as keyof typeof SIGNAL_STATUS_LABEL] ??
    null;

  return (
    <div className="px-3 sm:px-6 lg:px-15 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/trade-signals"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to signals
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                {signal.symbol}
                <Badge
                  variant={signal.side === "long" ? "success" : "destructive"}
                >
                  {signal.side.toUpperCase()}
                </Badge>
              </CardTitle>
              {statusEntry && (
                <Badge variant={statusEntry.variant} className="rounded-md">
                  {statusEntry.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {signal.company_name || signal.exchange}
              {signal.horizon ? ` · ${signal.horizon}` : ""}
              {signal.setup_code ? ` · ${signal.setup_code}` : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {signal.is_subscribed ? (
              <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Entry</p>
                  <p className="text-lg font-semibold">{signal.entry}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="text-lg font-semibold">{signal.stop_loss}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Targets</p>
                  <p className="text-lg font-semibold">
                    {Array.isArray(signal.targets)
                      ? signal.targets
                          .map((t) => (t as { level?: number }).level)
                          .filter((v) => v !== undefined)
                          .join(", ")
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
                <Lock className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Entry, stop loss, and targets are visible to subscribers of{" "}
                  {signal.analyst_name || "this analyst"}.
                </p>
                <Button onClick={handleSubscribe} disabled={subscribing}>
                  Subscribe Free to Unlock
                </Button>
              </div>
            )}

            {signal.thesis_pack &&
              Object.keys(signal.thesis_pack).length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Thesis</h3>
                  <pre className="whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                    {JSON.stringify(signal.thesis_pack, null, 2)}
                  </pre>
                </div>
              )}

            {!!signal.key_risks?.length && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Key Risks</h3>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {signal.key_risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Analyst</p>
                <p>
                  {signal.analyst_slug ? (
                    <Link
                      href={`/analysts/${signal.analyst_slug}`}
                      className="text-primary hover:underline"
                    >
                      {signal.analyst_name}
                    </Link>
                  ) : (
                    signal.analyst_name
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Detected</p>
                <p>{signal.detected_at || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Published</p>
                <p>{signal.published_at || "—"}</p>
              </div>
              {signal.closed_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Closed</p>
                  <p>{signal.closed_at}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
