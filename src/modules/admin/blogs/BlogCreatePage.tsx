"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/admin/PageHeader";
import BlogForm from "@/app/admin/(admin)/blogs/BlogForm";

export default function AdminBlogCreatePage() {
  const router = useRouter();

  return (
    <>
      <PageHeader title="Create Blog" backUrl="/admin/blogs" />

      <Card>
        <CardHeader>
          <CardTitle>Blog Information</CardTitle>
        </CardHeader>

        <CardContent>
          <BlogForm
            isEdit={false}
            onSuccess={() => router.push(`/admin/blogs`)}
          />
        </CardContent>
      </Card>
    </>
  );
}
