import { z } from "zod";
import {
  emailField,
  passwordField,
  phoneField,
  timezoneField,
} from "@/modules/account/user.fields";

const personNameField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .regex(/^[A-Za-z]+$/, `${label} must contain only letters`)
    .min(3, `${label} must be at least 3 characters`)
    .max(50, `${label} cannot exceed 50 characters`);

export const registerSchema = z.object({
  first_name: personNameField("First name"),
  last_name: personNameField("Last name"),
  email: emailField,
  phone: phoneField,
  password: passwordField.max(100, "Password cannot exceed 100 characters"),
  recaptcha_token: z.string({ error: "reCAPTCHA verification is required" }),
  timezone: timezoneField,
  country: z.string().optional().default("India"),
});

export type RegisterInput = z.input<typeof registerSchema>;

export const registerFormSchema = registerSchema
  .pick({
    first_name: true,
    last_name: true,
    email: true,
    phone: true,
    password: true,
  })
  .extend({
    confirm_password: z.string().min(1, "Password confirmation is required"),
    agree: z.boolean().refine((v) => v === true, {
      error: "You must agree to the Privacy Policy & Terms.",
    }),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;
