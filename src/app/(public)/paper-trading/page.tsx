import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMetaData } from "@/server/modules/public/seo.service";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getMetaData("paper-trading");
  return {
    title: "Paper Trading",
    description:
      "Try any analyst's signals risk-free with our built-in paper trading simulator — no broker account, no real money, same pipeline as live trading.",
    ...seo,
  };
}

export default function PaperTradingPage() {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Practice first. Risk nothing.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Paper trading runs through the exact same signal pipeline as a live
          broker connection — the only difference is what&apos;s on the other
          end.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add a paper connection instead of a real broker — no credentials
            needed. Every signal you subscribe to fills instantly at the
            published entry, and resolves against the same lifecycle (target
            reached, stopped, or expired) that live trades follow. Your
            Executions page shows exactly what would have happened.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Why it matters</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            An analyst&apos;s track record only means something if you&apos;ve
            watched it play out yourself. Paper trading lets you do that with
            your own risk settings, on your own dashboard, before a single rupee
            is ever at stake.
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/broker-connections/create">Start Paper Trading</Link>
        </Button>
      </div>
    </div>
  );
}
