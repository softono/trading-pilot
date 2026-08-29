import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMetaData } from "@/server/modules/public/seo.service";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getMetaData("brokers");
  return {
    title: "Supported Brokers",
    description:
      "Connect Groww, Dhan, Angel One, or Delta Exchange for automated execution of published trading signals — live and sandbox modes supported.",
    ...seo,
  };
}

const BROKERS = [
  {
    name: "Groww",
    market: "NSE Equity",
    modes: ["Live"],
    note: "Real stop-loss orders placed at entry.",
  },
  {
    name: "Dhan",
    market: "NSE Equity",
    modes: ["Live", "Sandbox"],
    note: "Sandbox mode fills every order at a fixed price with a reset daily balance — practice with zero risk.",
  },
  {
    name: "Angel One",
    market: "NSE Equity",
    modes: ["Live"],
    note: "TOTP-based login, the same auth flow used across our platform.",
  },
  {
    name: "Delta Exchange",
    market: "Crypto Derivatives",
    modes: ["Live", "Sandbox"],
    note: "Reserved for crypto-signal analysts — dormant until one is onboarded.",
  },
];

export default function BrokersPage() {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Supported Brokers</h1>
        <p className="mt-3 text-muted-foreground">
          Every broker runs through the same adapter interface, so a signal is
          executed identically regardless of which account it lands on.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
        {BROKERS.map((b) => (
          <Card key={b.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {b.name}
                <span className="text-xs font-normal text-muted-foreground">
                  {b.market}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex gap-2">
                {b.modes.map((m) => (
                  <Badge key={m} variant="secondary" className="rounded-md">
                    {m}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{b.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl text-center text-sm text-muted-foreground">
        Prefer not to risk real capital yet? Every analyst can also be followed
        with our built-in paper trading simulator — no broker connection
        required.
      </div>
    </div>
  );
}
