"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { httpRequest } from "@/lib/httpClient";
import type { ApiResult } from "@/types";
import type { Note } from "@/modules/note/note.types";
import { showError, showSuccess } from "@/lib/message";
import { applyServerErrors } from "@/lib/formErrors";
import {
  noteFormSchema,
  type NoteFormInput,
} from "@/modules/note/note.validator";

interface NoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  queryKey: readonly unknown[];
}

export default function NoteForm({
  open,
  onOpenChange,
  note,
  queryKey,
}: NoteFormProps) {
  const isEdit = Boolean(note);
  const queryClient = useQueryClient();

  const form = useForm<NoteFormInput>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { title: "", note: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ title: note?.title ?? "", note: note?.note ?? "" });
    }
  }, [open, note, form]);

  const saveMutation = useMutation({
    mutationFn: (values: NoteFormInput) =>
      note
        ? httpRequest<ApiResult>("patch", `notes/${note.id}`, values)
        : httpRequest<ApiResult>("post", "notes", values),
    onSuccess: (response) => {
      if (response.status === 1) {
        showSuccess(
          response.message ||
            (isEdit
              ? "Note updated successfully"
              : "Note created successfully"),
        );
        queryClient.invalidateQueries({ queryKey });
        onOpenChange(false);
      } else {
        showError(response.message || "Failed to save note");
      }
    },
    onError: (error: unknown) => {
      const err = error as { data?: { errors?: Record<string, string> } };
      const errors = err?.data?.errors;
      if (errors) {
        applyServerErrors(form.setError, errors);
        return;
      }
      showError("Failed to save note");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Note" : "Add Note"}</DialogTitle>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <FormItem className="mb-4">
                <FormLabel>
                  Title <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Note title" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field, fieldState }) => (
              <FormItem className="mb-4">
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your note..."
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
