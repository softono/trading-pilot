"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TRADING_NAV_LINKS = [
  { title: "Broker Connections", href: "/broker-connections" },
  { title: "Executions", href: "/executions" },
];

export function TradingNav() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-1 border-b">
      {TRADING_NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
            pathname?.startsWith(link.href)
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {link.title}
        </Link>
      ))}
    </div>
  );
}
