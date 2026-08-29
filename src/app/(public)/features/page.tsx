import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, ShieldCheck, Bot, Bell, Wallet, LineChart } from "lucide-react";
import { getMetaData } from "@/server/modules/public/seo.service";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getMetaData("features");
  return {
    title: "Features",
    description:
      "Live trading signals, Telegram delivery, and automated execution across your broker accounts — everything you need to act on a signal the moment it's published.",
    ...seo,
  };
}

const FEATURES = [
  {
    icon: Radio,
    title: "Live Signals",
    body: "AI and expert analysts publish entry, stop loss, and target levels the moment a setup is confirmed — visible on your dashboard and delivered instantly.",
  },
  {
    icon: Bot,
    title: "AI Analyst",
    body: "A systematic scanner runs multi-timeframe breakout/breakdown detection with a battery of false-breakout filters, then routes candidates through an AI review layer before anything publishes.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Design",
    body: "Every signal arrives over a signed, replay-protected webhook. Broker credentials are encrypted at rest and never leave your account.",
  },
  {
    icon: Bell,
    title: "Telegram Delivery",
    body: "Subscribe to an analyst's Telegram channel and get the same signal the moment it's published, plus a follow-up when it hits target or stop.",
  },
  {
    icon: Wallet,
    title: "Auto-Trading",
    body: "Connect a broker account and every published signal is sized to your risk, executed automatically, and protected with a real resting stop-loss order.",
  },
  {
    icon: LineChart,
    title: "Paper Trading",
    body: "Try any analyst risk-free with the built-in simulator — the exact same pipeline as a live account, no broker required.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Everything you need to trade on a signal
        </h1>
        <p className="mt-3 text-muted-foreground">
          From detection to delivery to execution — one pipeline, the same for
          every analyst and every broker.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/trade-signals">Browse Live Signals</Link>
        </Button>
      </div>
    </div>
  );
}
