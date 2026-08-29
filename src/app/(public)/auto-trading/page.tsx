import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMetaData } from "@/server/modules/public/seo.service";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getMetaData("auto-trading");
  return {
    title: "Auto-Trading",
    description:
      "Connect your broker account and let published signals execute automatically — risk-based position sizing and a real resting stop-loss on every trade.",
    ...seo,
  };
}

const STEPS = [
  {
    step: "1. Connect",
    body: "Add a broker connection with your risk-per-trade, capital, and position limits — encrypted and stored against your account only.",
  },
  {
    step: "2. Verify",
    body: "We confirm your credentials work with a live authenticated call before any order can ever be placed on the connection.",
  },
  {
    step: "3. Subscribe",
    body: "Subscribe to any analyst — every signal they publish is now eligible for execution on your connection.",
  },
  {
    step: "4. Execute",
    body: "The moment a signal publishes, quantity is computed from your risk settings and a market entry plus a real resting stop-loss order are placed automatically.",
  },
];

export default function AutoTradingPage() {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Auto-Trading, on your terms
        </h1>
        <p className="mt-3 text-muted-foreground">
          You set the risk limits. We handle sizing, order placement, and the
          stop-loss that protects you if you&apos;re away from the screen.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
        {STEPS.map((s) => (
          <Card key={s.step}>
            <CardHeader>
              <CardTitle>{s.step}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mx-auto mt-10 max-w-4xl">
        <CardHeader>
          <CardTitle>The guardrails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • A signal older than your configured freshness window is skipped,
            never executed late.
          </p>
          <p>
            • Max open positions and a daily loss cap stop new entries once you
            hit your own limits for the day.
          </p>
          <p>
            • Every attempt — placed, rejected, or skipped — is recorded with a
            reason on your Executions page, so nothing happens silently.
          </p>
        </CardContent>
      </Card>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/broker-connections">Connect a Broker</Link>
        </Button>
      </div>
    </div>
  );
}
