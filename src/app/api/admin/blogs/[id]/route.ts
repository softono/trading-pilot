import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { sendError, sendResult, sendResponse } from "@/server/utils/response";
import {
  getAdminBlogById,
  updateAdminBlog,
  deleteAdminBlog,
} from "@/server/modules/admin/blog/blog.service";
import { validateData } from "@/server/lib/validator";
import {
  blogSaveSchema,
  type BlogSaveInput,
} from "@/modules/blog/blog.validator";
import { getClientTimezone } from "@/server/lib/date";
import { parseBody } from "@/server/utils/parseBody";
import { uploadFile, validateFile, MIME_IMAGE } from "@/server/lib/file";
import { USER_STATUS } from "@/modules/account/user.constants";

type RouteContext = { params: Promise<{ id: string }> };

async function parseId(params: RouteContext["params"]): Promise<number | null> {
  const { id } = await params;
  const blogId = Number(id);
  return blogId && !isNaN(blogId) ? blogId : null;
}

async function getHandler(req: NextRequestWithAdmin, { params }: RouteContext) {
  const id = await parseId(params);
  if (!id) return sendError(400, "Invalid blog id");

  const blog = await getAdminBlogById(String(id), getClientTimezone(req));
  if (!blog) return sendError(404, "Blog not found");

  return sendResponse(200, {
    status: 1,
    data: blog,
    message: "Blog fetched successfully",
  });
}

async function patchHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const id = await parseId(params);
  if (!id) return sendError(400, "Invalid blog id");

  const { fields, files } = await parseBody(req);

  // Status toggle action: PATCH { action: "activate" | "deactivate" }
  const action = fields.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(400, "Invalid action");
    }

    const data: Partial<BlogSaveInput> = {
      status: action === "activate" ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE,
    };

    const blog = await updateAdminBlog(id, data, getClientTimezone(req));
    if (!blog) return sendError(404, "Blog not found");

    return sendResponse(200, {
      status: 1,
      data: blog,
      message: `Blog ${action === "activate" ? "activated" : "deactivated"} successfully`,
    });
  }

  const validated = validateData(blogSaveSchema.partial(), fields);
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

  const blog = await updateAdminBlog(id, data, getClientTimezone(req));
  if (!blog) return sendError(404, "Blog not found");

  return sendResponse(200, {
    status: 1,
    data: blog,
    message: "Blog updated successfully",
  });
}

async function deleteHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const id = await parseId(params);
  if (!id) return sendError(400, "Invalid blog id");

  const deleted = await deleteAdminBlog(id);
  if (!deleted) return sendError(404, "Blog not found");

  return sendResponse(200, {
    status: 1,
    data: deleted,
    message: "Blog deleted successfully",
  });
}

export const GET = withAdminAuth(getHandler);
export const PATCH = withAdminAuth(patchHandler);
export const DELETE = withAdminAuth(deleteHandler);
