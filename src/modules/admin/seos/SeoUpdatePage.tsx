"use client";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/admin/PageHeader";

import SeoMetaForm from "@/modules/admin/seos/SeoForm";
import { useRef } from "react";

export default function SeoMetaUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const formRef = useRef<{ refetchSeoMeta: () => void }>(null);

  const handleSuccess = () => {
    if (id) {
      router.push(`/admin/seos`);
    } else if (formRef.current) {
      formRef.current.refetchSeoMeta();
    }
  };

  return (
    <>
      <PageHeader title="Update SEO Meta" backUrl="/admin/seos" />
      <Card>
        <CardHeader>
          <CardTitle>SEO Meta Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoMetaForm
            ref={formRef}
            isEdit={true}
            id={id}
            onSuccess={handleSuccess}
            onError={() => router.push("/admin/seos")}
          />
        </CardContent>
      </Card>
    </>
  );
}
