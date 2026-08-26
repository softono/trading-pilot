import { z } from "zod";
import { emailField } from "@/modules/account/user.fields";

export const contactSchema = z.object({
  name: z.string({ error: "Name is required" }).trim(),
  email: emailField,
  subject: z.string({ error: "Subject is required" }).trim(),
  message: z.string({ error: "Message is required" }).trim(),
  captcha_token: z.string({ error: "reCAPTCHA verification is required" }),
});

export type ContactInput = z.input<typeof contactSchema>;

export const contactFormSchema = contactSchema.pick({
  name: true,
  email: true,
  subject: true,
  message: true,
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
