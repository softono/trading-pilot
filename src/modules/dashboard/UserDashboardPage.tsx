"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  User,
  Settings,
  FileText,
  Mail,
  ArrowRight,
  Loader2,
  Radio,
  Users,
  Wallet,
} from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace("/login");
    return null;
  }

  const quickLinks = [
    {
      icon: Radio,
      title: "Trade Signals",
      desc: "Browse live signals from analysts",
      href: "/trade-signals",
    },
    {
      icon: Users,
      title: "My Subscriptions",
      desc: "Analysts you're subscribed to",
      href: "/subscriptions",
    },
    {
      icon: Wallet,
      title: "Auto-Trading",
      desc: "Broker connections and executions",
      href: "/broker-connections",
    },
    {
      icon: User,
      title: "My Profile",
      desc: "View and update your account details",
      href: "/account/update",
    },
    {
      icon: Settings,
      title: "Settings",
      desc: "Manage your preferences and security",
      href: "/account/update",
    },
    {
      icon: FileText,
      title: "Blog",
      desc: "Read the latest posts and articles",
      href: "/blog",
    },
    {
      icon: Mail,
      title: "Contact Us",
      desc: "Get in touch with our support team",
      href: "/contact",
    },
  ];

  return (
    <div className="min-h-screen sm:px-6 lg:px-10 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Account Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name</span>
              <p className="font-medium">
                {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                  "—"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Email</span>
              <p className="font-medium">{user?.email || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Member since</span>
              <p className="font-medium">
                {(user?.created_at as string) || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((item) => (
          <Card
            key={item.title}
            className="group hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-6">
              <item.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
              <Button variant="ghost" size="sm" className="px-0" asChild>
                <Link href={item.href}>
                  Go <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
