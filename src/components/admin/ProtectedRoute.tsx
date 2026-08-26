"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AdminAuthContext";
import type { ReactNode } from "react";
import { getRoutePermission } from "@/modules/account/permission";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasPermission, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Authentication is owned by AdminAuthContext + the proxy: an invalid session
  // clears the cookie and reloads, so the proxy routes to login. Here we only
  // enforce per-route permissions for an already-authenticated user.
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const requiredPermission = getRoutePermission(pathname);
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.replace("/admin/dashboard");
    }
  }, [isAuthenticated, pathname, hasPermission, router, loading]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
