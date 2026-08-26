import { z } from "zod";
import { nameField, phoneField } from "@/modules/account/user.fields";

export const accountUpdateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  phone: z.string().optional(),
  image: z.string().optional(),
});

export type AccountUpdateInput = z.input<typeof accountUpdateSchema>;

export const accountUpdateFormSchema = z.object({
  first_name: nameField("First name"),
  last_name: nameField("Last name"),
  phone: phoneField,
});

export type AccountUpdateFormInput = z.infer<typeof accountUpdateFormSchema>;
