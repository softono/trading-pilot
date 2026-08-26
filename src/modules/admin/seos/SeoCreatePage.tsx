"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/admin/PageHeader";
import SeoMetaForm from "@/modules/admin/seos/SeoForm";

export default function SeoMetaCreatePage() {
  const router = useRouter();

  return (
    <>
      <PageHeader title="Create SEO Meta" backUrl="/admin/seos" />

      <Card>
        <CardHeader>
          <CardTitle>SEO Meta Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoMetaForm
            isEdit={false}
            onSuccess={() => router.push("/admin/seos")}
          />
        </CardContent>
      </Card>
    </>
  );
}
