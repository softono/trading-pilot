import { sendError, sendResult } from "@/server/utils/response";
import { withAdminAuth } from "@/server/middleware/withAdminAuth";
import { NextRequestWithAdmin } from "@/server/middleware/types";
import {
  getAdminSeoMetaById,
  updateAdminSeoMeta,
  deleteAdminSeoMeta,
} from "@/server/modules/admin/seo/seo.service";
import { validateData } from "@/server/lib/validator";
import { seoMetaSaveSchema } from "@/modules/admin/seos/seo.validator";

type RouteContext = { params: Promise<{ id: string }> };

async function getHandler(req: NextRequestWithAdmin, { params }: RouteContext) {
  const { id } = await params;

  const result = await getAdminSeoMetaById(id);
  return sendResult(result);
}

async function patchHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Status toggle action: PATCH { action: "activate" | "deactivate" }
  const action = body?.action;
  if (action) {
    if (action !== "activate" && action !== "deactivate") {
      return sendError(400, "Invalid action");
    }

    const result = await updateAdminSeoMeta(id, {
      sitemap_enable: action === "activate" ? 1 : 0,
    });

    return sendResult(result);
  }

  const validated = validateData(seoMetaSaveSchema.partial(), body);
  if (!validated.status) return sendResult(validated);

  const result = await updateAdminSeoMeta(id, validated.data);
  return sendResult(result);
}

async function deleteHandler(
  req: NextRequestWithAdmin,
  { params }: RouteContext,
) {
  const { id } = await params;

  const result = await deleteAdminSeoMeta(id);
  return sendResult(result);
}

export const GET = withAdminAuth(getHandler);
export const PATCH = withAdminAuth(patchHandler);
export const DELETE = withAdminAuth(deleteHandler);
