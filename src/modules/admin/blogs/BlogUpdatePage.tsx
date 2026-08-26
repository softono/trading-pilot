"use client";

import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/admin/PageHeader";
import BlogForm from "@/app/admin/(admin)/blogs/BlogForm";

export default function AdminBlogUpdatePage() {
  const router = useRouter();
  const params = useParams();

  const id = params?.id as string;

  return (
    <>
      <PageHeader title="Update Blog" backUrl="/admin/blogs" />

      <Card>
        <CardHeader>
          <CardTitle>Edit Blog Information</CardTitle>
        </CardHeader>

        <CardContent>
          <BlogForm
            isEdit={true}
            id={id}
            onSuccess={() => router.push("/admin/blogs")}
          />
        </CardContent>
      </Card>
    </>
  );
}
