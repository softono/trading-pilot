import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import {
  updateMyConnection,
  deleteMyConnection,
  withoutCredentials,
} from "@/server/modules/broker/broker-connection.service";
import { getConnectionForUser } from "@/server/models/broker-connection.repository";
import { validateData } from "@/server/lib/validator";
import { brokerConnectionSaveSchema } from "@/modules/broker/broker.validator";

type RouteContext = { params: Promise<{ id: string }> };

async function parseId(params: RouteContext["params"]): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return n && !Number.isNaN(n) ? n : null;
}

async function getHandler(req: NextRequestWithUser, { params }: RouteContext) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const id = await parseId(params);
  if (!id) return sendError(400, "Invalid connection id");

  const row = await getConnectionForUser(id, userId);
  if (!row) return sendError(404, "Connection not found");

  return sendResult({
    http_status: 200,
    status: 1,
    message: "ok",
    data: withoutCredentials(row),
  });
}

async function patchHandler(
  req: NextRequestWithUser,
  { params }: RouteContext,
) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const id = await parseId(params);
  if (!id) return sendError(400, "Invalid connection id");

  const body = await req.json().catch(() => ({}));
  const validated = validateData(brokerConnectionSaveSchema.partial(), body);
  if (!validated.status) return sendResult(validated);

  const result = await updateMyConnection(userId, id, validated.data);
  return sendResult(result);
}

async function deleteHandler(
  req: NextRequestWithUser,
  { params }: RouteContext,
) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const id = await parseId(params);
  if (!id) return sendError(400, "Invalid connection id");

  const result = await deleteMyConnection(userId, id);
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const PATCH = withUserAuth(patchHandler);
export const DELETE = withUserAuth(deleteHandler);
