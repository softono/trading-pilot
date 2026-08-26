"use client";
import { ReactNode } from "react";
import { AuthenticatedLayout } from "./layout/main";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";

export default function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </ProtectedRoute>
  );
}
