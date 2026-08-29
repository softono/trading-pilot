import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { getMetaData } from "@/server/modules/public/seo.service";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getMetaData("pricing");
  return {
    title: "Pricing",
    description:
      "Every analyst is free during our beta — subscribe to as many as you like, no credit card required.",
    ...seo,
  };
}

const INCLUDED = [
  "Unlimited analyst subscriptions",
  "Live signal delivery on the site and Telegram",
  "Paper trading with any analyst",
  "Auto-trading on your own connected broker",
];

export default function PricingPage() {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="success" className="mb-3">
          Beta
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Every analyst is free right now
        </h1>
        <p className="mt-3 text-muted-foreground">
          We&apos;re in beta — subscribe to any analyst at no cost while we
          build out paid plans. No credit card, no trial clock.
        </p>
      </div>

      <Card className="mx-auto mt-10 max-w-md border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Free</CardTitle>
          <p className="text-4xl font-bold">₹0</p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/analysts">Browse Analysts</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Paid plans with premium analysts are coming in a future update — nothing
        changes for existing free subscriptions when they launch.
      </p>
    </div>
  );
}
