"use client";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminForm, {
  type AdminFormHandle,
} from "@/modules/admin/admins/AdminForm";
import { useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";

export default function AdminUpdate() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const formRef = useRef<AdminFormHandle>(null);

  const handleSuccess = (id?: unknown) => {
    //console.log("handleSuccess called");
    if (id as string) {
      router.push(`/admin/admins`);
    } else if (formRef.current) {
      formRef.current.refetchAdmin();
    }
  };

  return (
    <>
      <PageHeader title="Update Admin" backUrl="/admin/admins" />
      <Card>
        <CardHeader>
          <CardTitle>Admin Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminForm
            ref={formRef}
            isEdit={true}
            id={id}
            onSuccess={handleSuccess}
            onError={() => router.push("/admin/admins")}
          />
        </CardContent>
      </Card>
    </>
  );
}
