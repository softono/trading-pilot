"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { MainLayout } from "../layout/main";
import { authClient } from "@/lib/authClient";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <UserLayoutInner>{children}</UserLayoutInner>
    </AuthProvider>
  );
}

function UserLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  // Auth is owned by the proxy: an invalid session clears the cookie and
  // reloads the current path, so the proxy routes to login with ?redirect=.
  useEffect(() => {
    if (loading || isAuthenticated) return;
    authClient.signOut().finally(() => {
      window.location.href = pathname;
    });
  }, [loading, isAuthenticated, pathname]);

  if (loading || !isAuthenticated) {
    return null;
  }

  return <MainLayout>{children}</MainLayout>;
}
