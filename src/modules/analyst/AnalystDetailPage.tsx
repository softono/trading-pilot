"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { ANALYST_TYPE_LABEL } from "@/modules/analyst/analyst.constants";
import type { AnalystProfile } from "@/modules/analyst/analyst.types";
import TradeSignalListPage from "@/modules/signal/TradeSignalListPage";

export default function AnalystDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-analyst", slug],
    queryFn: () =>
      httpRequest<ApiResult<AnalystProfile>>("get", `analysts/${slug}`),
    enabled: !!slug,
  });

  const analyst = data?.status === 1 ? data.data : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !analyst) {
    return (
      <div className="px-3 sm:px-6 lg:px-15 py-6">
        <p className="text-destructive">Analyst not found.</p>
      </div>
    );
  }

  const typeEntry = ANALYST_TYPE_LABEL[analyst.analyst_type];

  return (
    <div className="px-3 sm:px-6 lg:px-15 py-6">
      <div className="mx-auto max-w-3xl">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              {analyst.avatar && (
                // eslint-disable-next-line @next/next/no-img-element -- avatar host is user-provided, arbitrary domains
                <img
                  src={analyst.avatar}
                  alt={analyst.display_name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {analyst.display_name}
                  <Badge variant={typeEntry.variant}>{typeEntry.label}</Badge>
                </CardTitle>
                {analyst.headline && (
                  <p className="text-sm text-muted-foreground">
                    {analyst.headline}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          {analyst.bio && (
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{analyst.bio}</p>
            </CardContent>
          )}
        </Card>
      </div>

      <TradeSignalListPage analystId={analyst.user_id} />
    </div>
  );
}
