import type { Metadata } from "next";
import UserDashboardPage from "@/modules/dashboard/UserDashboardPage";

export const metadata: Metadata = {
  title: "Dashboard - Next App",
  description: "Your personal dashboard",
};

export default function Page() {
  return <UserDashboardPage />;
}
