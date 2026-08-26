import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat } from "@/server/lib/date";

import type { ApiResult } from "@/types";
import type { PaginationInput } from "@/components/tsgrid/pagination.validator";
import type { NoteSaveInput } from "@/modules/note/note.validator";
import {
  listNotes,
  createNoteForUser,
  updateNoteForUser,
  deleteNoteForUser,
  noteSortMap,
} from "@/server/models/note.repository";

export async function notelist(
  userId: string,
  body: PaginationInput,
  tz: string,
): Promise<ApiResult> {
  const search = (body.search?.value || "").trim();

  const query = listNotes(userId, search || undefined);

  return Pagination.paginate(query, body, noteSortMap, {
    defaultSort: { field: "created_at", direction: "desc" },
    mapRow: (row) => ({
      ...row,
      created_at: dateTimeFormat(row.created_at as Date, tz),
      updated_at: dateTimeFormat(row.updated_at as Date, tz),
    }),
  });
}

export async function createNote(
  userId: string,
  data: NoteSaveInput,
): Promise<ApiResult> {
  const row = await createNoteForUser(userId, {
    title: data.title,
    note: data.note,
  });

  return {
    http_status: 201,
    status: 1,
    message: "Note created successfully",
    data: row,
  };
}

export async function updateNote(
  userId: string,
  id: number,
  data: Partial<NoteSaveInput>,
): Promise<ApiResult> {
  const row = await updateNoteForUser(id, userId, {
    ...data,
    updated_at: new Date(),
  });

  if (!row) {
    return { http_status: 404, status: 0, message: "Note not found" };
  }

  return {
    http_status: 200,
    status: 1,
    message: "Note updated successfully",
    data: row,
  };
}

export async function deleteNote(
  userId: string,
  id: number,
): Promise<ApiResult> {
  const row = await deleteNoteForUser(id, userId);

  if (!row) {
    return { http_status: 404, status: 0, message: "Note not found" };
  }

  return {
    http_status: 200,
    status: 1,
    message: "Note deleted successfully",
    data: row,
  };
}
