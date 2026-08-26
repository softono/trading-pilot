"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tsgrid/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { httpRequest } from "@/lib/httpClient";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import type { ApiResult } from "@/types";
import type { Note } from "@/modules/note/note.types";
import NoteForm from "@/modules/note/NoteForm";

const NOTES_QUERY_KEY = ["notes"] as const;

function NoteActions({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(note)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Note"
        description="Are you sure you want to delete this note?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={() => onDelete(note.id)}
      />
    </>
  );
}

export default function NotesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const { deleteItem: handleDelete } = useDeleteEntity<number>(
    (id: number) => httpRequest<ApiResult>("delete", `notes/${id}`),
    NOTES_QUERY_KEY,
    "Note",
  );

  const handleAdd = useCallback(() => {
    setEditingNote(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((note: Note) => {
    setEditingNote(note);
    setFormOpen(true);
  }, []);

  const columns: ColumnDef<Note>[] = useMemo(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "note",
        accessorKey: "note",
        header: "Note",
        meta: { sortable: true, filterVariant: "text" },
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        meta: { sortable: true },
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        header: "Updated At",
        meta: { sortable: true },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <NoteActions
            note={row.original}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ),
      },
    ],
    [handleEdit, handleDelete],
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notes</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Note>
            columns={columns}
            queryKey={NOTES_QUERY_KEY}
            fetcher={(params) => httpRequest<ApiResult>("get", "notes", params)}
          />
        </CardContent>
      </Card>

      <NoteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        note={editingNote}
        queryKey={NOTES_QUERY_KEY}
      />
    </>
  );
}
