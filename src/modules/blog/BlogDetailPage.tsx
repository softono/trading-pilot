"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { BLOG_CATEGORIES } from "@/modules/blog/blog.constants";
import type { Blog } from "@/modules/blog/blog.types";

function getCategoryLabel(value: string) {
  return (
    BLOG_CATEGORIES.find((c: { value: string }) => c.value === value)?.label ??
    value
  );
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => httpRequest<ApiResult>("get", `blogs/${slug}`),
    enabled: !!slug,
  });

  const blog = data?.data as Blog | undefined;

  if (isLoading) {
    return (
      <div className="px-3 sm:px-6 lg:px-15 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="px-3 sm:px-6 lg:px-15 py-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-2 text-xl font-bold">Blog not found</h1>
          <Link href="/blog" className="text-sm text-primary hover:underline">
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 lg:px-15 py-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <article>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {getCategoryLabel(blog.category)}
            </span>
            <span className="text-sm text-muted-foreground">
              {blog.created_at}
            </span>
          </div>

          <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            {blog.title}
          </h1>

          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.body }}
          />
        </article>
      </div>
    </div>
  );
}
