"use client";

import React from "react";
import { TopNav } from "./top-nav";
import { Header } from "./header";
import { MainContent } from "./main-content";
import Footer from "./footer";
import { useAuth } from "@/context/AuthContext";
import { USER_ROLES } from "@/modules/account/user.constants";

type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const isAnalyst = user?.role === USER_ROLES.ANALYST;

  const navLinks = [
    { title: "Home", href: "/", isActive: true },
    { title: "Trade Signals", href: "/trade-signals", isActive: true },
    { title: "Contact", href: "/contact", isActive: true },
    { title: "Blog", href: "/blog", isActive: true },
    ...(isAuthenticated
      ? [{ title: "Notes", href: "/notes", isActive: true }]
      : []),
    ...(isAuthenticated
      ? [{ title: "Subscriptions", href: "/subscriptions", isActive: true }]
      : []),
    ...(isAuthenticated
      ? [{ title: "Auto-Trading", href: "/broker-connections", isActive: true }]
      : []),
    ...(isAuthenticated
      ? [
          isAnalyst
            ? {
                title: "Analyst Panel",
                href: "/analyst/profile",
                isActive: true,
              }
            : {
                title: "Become an Analyst",
                href: "/analyst/apply",
                isActive: true,
              },
        ]
      : []),
  ];

  return (
    <>
      <Header navLinks={navLinks}>
        <div className="ml-6">
          <TopNav links={navLinks} />
        </div>
      </Header>
      <MainContent>{children}</MainContent>
      <Footer />
    </>
  );
}
