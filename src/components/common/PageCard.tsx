"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function PageCard({
  title,
  children,
  className = "",
}: PageCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
