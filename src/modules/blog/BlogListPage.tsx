"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { TsGrid } from "@/components/tsgrid/TsGrid";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import { BLOG_CATEGORIES } from "@/modules/blog/blog.constants";
import type { Blog } from "@/modules/blog/blog.types";

type BlogListItem = Pick<
  Blog,
  "id" | "slug" | "title" | "excerpt" | "category" | "image" | "created_at"
>;

const columns: ColumnDef<BlogListItem>[] = [
  {
    accessorKey: "title",
    header: "Title",
    meta: { sortable: true },
  },
  {
    accessorKey: "category",
    header: "Category",
    meta: {
      sortable: true,
      filterVariant: "multiSelect",
      options: BLOG_CATEGORIES.map((c: { label: string; value: string }) => ({
        label: c.label,
        value: c.value,
      })),
    },
  },
  {
    accessorKey: "created_at",
    header: "Date",
    meta: { sortable: true },
  },
];

function getCategoryLabel(value: string) {
  return (
    BLOG_CATEGORIES.find((c: { value: string }) => c.value === value)?.label ??
    value
  );
}

function BlogCard({ row }: { row: BlogListItem }) {
  return (
    <Link href={`/blog/${row.slug}`} className="group block">
      <div className="h-full rounded-lg border bg-card p-5 transition-shadow hover:shadow-md">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {getCategoryLabel(row.category)}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.created_at}
          </span>
        </div>
        <h3 className="mb-2 text-base font-semibold leading-snug group-hover:text-primary">
          {row.title}
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {row.excerpt}
        </p>
      </div>
    </Link>
  );
}

export default function BlogListPage() {
  return (
    <div className="px-3 sm:px-6 lg:px-15 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Blog</h1>
      <TsGrid<BlogListItem>
        columns={columns}
        queryKey={["blogs"]}
        fetcher={(params) => httpRequest<ApiResult>("get", "blogs", params)}
        renderCard={(row) => <BlogCard row={row} />}
        getRowId={(row) => row.id}
        searchPlaceholder="Search articles…"
        defaultLimit={12}
        pageSizeOptions={[12, 24, 48]}
        gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
