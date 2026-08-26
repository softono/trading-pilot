"use client";

import PageHeader from "@/components/common/PageHeader";

type AdminPageHeaderProps = Omit<
  React.ComponentProps<typeof PageHeader>,
  "backUrl"
> & { backUrl?: string };

export default function AdminPageHeader({
  backUrl = "/admin/users",
  ...props
}: AdminPageHeaderProps) {
  return <PageHeader backUrl={backUrl} {...props} />;
}
