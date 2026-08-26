import { Pagination } from "@/server/lib/pagination";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";
import type { ApiResult } from "@/types";
import { dateTimeFormat, dateFormat } from "@/server/lib/date";
import { getFileUrl } from "@/server/lib/file";
import {
  listPublicBlog,
  findActiveBlogBySlug,
  blogSortMap,
} from "@/server/models/blog.repository";

export async function list(
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const query = listPublicBlog({
    search: body.search?.value,
    category: body.filter?.category,
  });

  return Pagination.paginate(query, body, blogSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      image: getFileUrl(row.image, "images"),
      created_at: dateFormat(row.created_at as Date, tz),
    }),
  });
}

export async function getBySlug(slug: string, tz: string): Promise<ApiResult> {
  const blog = await findActiveBlogBySlug(slug);

  if (!blog) {
    return { http_status: 404, status: 0, message: "Blog not found" };
  }

  return {
    http_status: 200,
    status: 1,
    message: "Ok",
    data: {
      ...blog,
      image: getFileUrl(blog.image, "images"),
      created_at: dateFormat(blog.created_at as Date, tz),
      updated_at: dateTimeFormat(blog.updated_at as Date, tz),
    },
  };
}
