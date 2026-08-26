"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  backUrl?: string;
  showBackBtn?: boolean;
  titleClassName?: string;
}

export default function PageHeader({
  title,
  backUrl = "/",
  showBackBtn = true,
  titleClassName = "text-3xl font-bold tracking-tight ml-5",
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(backUrl);
  };

  return (
    <div className="flex items-center justify-between space-y-6">
      <h1 className={titleClassName}>{title}</h1>
      {showBackBtn && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="ml-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}
    </div>
  );
}
