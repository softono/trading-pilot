import type { Metadata } from "next";
import "./globals.css";
import { applyThemeScript } from "@/components/switchcn";
import { getColorMode } from "@/components/switchcn/color-mode-server";
import { clientTimezoneScript } from "@/lib/date";
import { Providers } from "./layout/providers";
import Script from "next/script";
import config from "@/config";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: config.APP_NAME,
  description: "Next.js full-stack boilerplate",
  icons: {
    icon: config.APP_FAVICON,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const htmlClass = await getColorMode();
  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <Script id="apply-theme">{applyThemeScript}</Script>
        <Script id="client-timezone">{clientTimezoneScript}</Script>
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster
          toastOptions={{
            style: {
              background: "var(--color-card)",
              color: "var(--color-card-foreground)",
              border: "1px solid var(--color-border)",
            },
            success: {
              style: {
                background: "var(--color-card)",
                color: "var(--color-card-foreground)",
              },
            },
            error: {
              style: {
                background: "var(--color-card)",
                color: "var(--color-card-foreground)",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
