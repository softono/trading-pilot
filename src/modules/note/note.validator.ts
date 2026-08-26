import { z } from "zod";

export const noteSaveSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  note: z.string().trim().optional(),
});

export type NoteSaveInput = z.input<typeof noteSaveSchema>;

export const noteFormSchema = noteSaveSchema;

export type NoteFormInput = z.infer<typeof noteFormSchema>;
