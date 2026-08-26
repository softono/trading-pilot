import { sendError, sendResult, sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import {
  listBlogs,
  createAdminBlog,
} from "@/server/modules/admin/blog/blog.service";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { blogSaveSchema } from "@/modules/blog/blog.validator";
import { getClientTimezone } from "@/server/lib/date";
import { parseBody } from "@/server/utils/parseBody";
import { uploadFile, validateFile, MIME_IMAGE } from "@/server/lib/file";

async function getHandler(req: NextRequestWithAdmin) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const tz = getClientTimezone(req);
  const res = await listBlogs(validated.data, tz);
  return sendResult(res);
}

async function postHandler(req: NextRequestWithAdmin) {
  const { fields, files } = await parseBody(req);

  const validated = validateData(blogSaveSchema, fields);
  if (!validated.status) return sendResult(validated);
  const data = validated.data;

  if (files?.image) {
    const validation = await validateFile(files.image, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: MIME_IMAGE,
    });
    if (!validation.isValid) {
      return sendError(400, validation.error || "Invalid file");
    }
    data.image = await uploadFile(files.image, "images");
  }

  const blog = await createAdminBlog(data, getClientTimezone(req));

  return sendResponse(201, {
    status: 1,
    data: blog,
    message: "Blog created successfully",
  });
}

export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler);
