"use client";
import React from "react";
import Image from "next/image";
import config from "@/config";
import { AuthProvider } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFileUrl } from "@/utils/fileurl";

type BlankLayoutProps = {
  children: React.ReactNode;
};

export default function BlankLayout({ children }: BlankLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-muted">
        <Card className="w-full max-w-md gap-6 sm:p-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Image
                src={getFileUrl(config.APP_LOGO)}
                alt={config.APP_NAME}
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
                unoptimized
              />
              <div>
                <CardTitle className="text-lg tracking-tight">
                  Welcome to {config.APP_NAME}
                </CardTitle>
                <CardDescription>Please Log-in to your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full">{children}</div>
          </CardContent>
        </Card>
      </div>
    </AuthProvider>
  );
}
