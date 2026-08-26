import { NextRequestWithUser } from "@/server/middleware/types";
import { sendError, sendResult } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { updateNote, deleteNote } from "@/server/modules/note/note.service";
import { validateData } from "@/server/lib/validator";
import { noteSaveSchema } from "@/modules/note/note.validator";

type RouteContext = { params: Promise<{ id: string }> };

async function parseNoteId(
  params: RouteContext["params"],
): Promise<number | null> {
  const { id } = await params;
  const noteId = Number(id);
  return noteId && !Number.isNaN(noteId) ? noteId : null;
}

async function patchHandler(
  req: NextRequestWithUser,
  { params }: RouteContext,
) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const id = await parseNoteId(params);
  if (!id) return sendError(400, "Invalid note id");

  const body = await req.json().catch(() => ({}));

  const validated = validateData(noteSaveSchema.partial(), body);
  if (!validated.status) return sendResult(validated);

  const result = await updateNote(userId, id, validated.data);
  return sendResult(result);
}

async function deleteHandler(
  req: NextRequestWithUser,
  { params }: RouteContext,
) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const id = await parseNoteId(params);
  if (!id) return sendError(400, "Invalid note id");

  const result = await deleteNote(userId, id);
  return sendResult(result);
}

export const PATCH = withUserAuth(patchHandler);
export const DELETE = withUserAuth(deleteHandler);
