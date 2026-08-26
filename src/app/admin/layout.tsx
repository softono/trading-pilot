import { ReactNode } from "react";
import { AuthProvider } from "@/context/AdminAuthContext";
import "./admin.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
