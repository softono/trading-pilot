"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { USER_ROLES } from "@/modules/account/user.constants";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const ANALYST_NAV_LINKS = [
  { title: "Profile", href: "/analyst/profile" },
  { title: "API Keys", href: "/analyst/api-keys" },
  { title: "Settings", href: "/analyst/settings" },
];

function AnalystNav() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-1 border-b">
      {ANALYST_NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
            pathname === link.href
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

export function AnalystRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAnalyst = user?.role === USER_ROLES.ANALYST;

  useEffect(() => {
    if (loading) return;
    if (!isAnalyst) router.replace("/analyst/apply");
  }, [loading, isAnalyst, router]);

  if (loading || !isAnalyst) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AnalystNav />
      {children}
    </>
  );
}
