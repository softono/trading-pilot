"use client";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserForm from "@/modules/admin/users/UserForm";
import PageHeader from "@/components/admin/PageHeader";

export default function AdminUserUpdatePage() {
  const router = useRouter();
  const { id } = useParams() as { id?: string };

  if (!id) {
    return (
      <>
        <PageHeader title="Invalid User" backUrl="/admin/users" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">User ID is missing.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Update User" showBackBtn={true} />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            key={id}
            isEdit={true}
            id={id}
            onSuccess={() => router.push("/admin/users")}
          />
        </CardContent>
      </Card>
    </>
  );
}
