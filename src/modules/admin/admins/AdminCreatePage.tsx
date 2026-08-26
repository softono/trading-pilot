"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminForm from "@/modules/admin/admins/AdminForm";
import PageHeader from "@/components/admin/PageHeader";

export default function AdminCreate() {
  const router = useRouter();

  return (
    <>
      <PageHeader title="Create Admin" backUrl="/admin/admins" />
      <Card>
        <CardHeader>
          <CardTitle>Admin Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminForm
            isEdit={false}
            onSuccess={() => router.push(`/admin/admins`)}
          />
        </CardContent>
      </Card>
    </>
  );
}
