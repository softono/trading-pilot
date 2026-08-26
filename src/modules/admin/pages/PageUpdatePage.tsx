"use client";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageForm from "@/app/admin/(admin)/pages/update/[id]/_form";
import PageHeader from "@/components/admin/PageHeader";

export default function PageUpdate() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <PageHeader title="Update Page" backUrl="/admin/pages" />
      <Card>
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PageForm
            isEdit={true}
            id={id}
            onSuccess={() => router.push("/admin/pages")}
          />
        </CardContent>
      </Card>
    </>
  );
}
