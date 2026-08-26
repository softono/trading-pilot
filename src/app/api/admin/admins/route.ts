import { sendError, sendResult, sendResponse } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import { listAdmins } from "@/server/modules/admin/admin/admin.service";
import { createAccount } from "@/server/modules/account/account.service";
import { validateData } from "@/server/lib/validator";
import { paginationSchema } from "@/components/tsgrid/pagination.validator";
import { parsePaginationQuery } from "@/server/lib/pagination";
import { adminCreateSchema } from "@/server/modules/admin/admin/create.validator";
import { uploadFile, validateFile, MIME_IMAGE } from "@/server/lib/file";
import { parseBody } from "@/server/utils/parseBody";
import { USER_STATUS } from "@/modules/account/user.constants";
import { getClientTimezone } from "@/server/lib/date";

async function getHandler(req: NextRequestWithAdmin) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);

  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const res = await listAdmins(validated.data, getClientTimezone(req));
  return sendResult(res);
}

async function postHandler(req: NextRequestWithAdmin) {
  const { fields, files } = await parseBody(req);

  const validated = validateData(adminCreateSchema, fields);
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
    data.image = await uploadFile(files.image, "profile");
  }

  const res = await createAccount(
    {
      ...data,
      email: data.email.toLowerCase(),
      role: data.role ?? "ADMIN",
      status: data.status ?? USER_STATUS.ACTIVE,
      emailVerified: false,
    },
    { role: data.role ?? "ADMIN", entityLabel: "Admin" },
  );

  if (res.status === 0)
    return sendError(500, res.message ?? "An unexpected error occurred");

  return sendResponse(201, {
    status: 1,
    message: "Admin created successfully",
    data: res.data,
  });
}

export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler);
