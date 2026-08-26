"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserForm from "@/modules/admin/users/UserForm";
import PageHeader from "@/components/admin/PageHeader";

export default function AdminUserCreatePage() {
  const router = useRouter();

  return (
    <>
      <PageHeader title="Create User" backUrl="/admin/users" />
      <Card>
        <CardHeader>
          <CardTitle>User Create</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            isEdit={false}
            onSuccess={() => router.push(`/admin/users`)}
          />
        </CardContent>
      </Card>
    </>
  );
}
