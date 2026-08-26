import { z } from "zod";

export const applicationSaveSchema = z.object({
  pitch: z.string().trim().min(20, "Tell us a bit more (min 20 characters)"),
  experience_years: z.number().int().min(0).max(60).optional(),
  specialties: z.array(z.string().trim().min(1)).optional(),
  website: z
    .string()
    .trim()
    .url("Please provide a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ApplicationSaveInput = z.input<typeof applicationSaveSchema>;

export const applicationFormSchema = applicationSaveSchema;

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;

export const applicationRejectSchema = z.object({
  rejection_reason: z.string().trim().min(1, "Reason is required"),
});

export type ApplicationRejectInput = z.input<typeof applicationRejectSchema>;

export const analystProfileSaveSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required"),
  headline: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(4000).optional(),
  specialties: z.array(z.string().trim().min(1)).optional(),
  socials: z.record(z.string(), z.string().trim()).optional(),
  is_public: z.boolean().optional(),
});

export type AnalystProfileSaveInput = z.input<typeof analystProfileSaveSchema>;

export const analystProfileFormSchema = analystProfileSaveSchema;

export type AnalystProfileFormInput = z.infer<typeof analystProfileFormSchema>;

export const apiKeyCreateSchema = z.object({
  label: z.string().trim().max(80).optional(),
});

export type ApiKeyCreateInput = z.input<typeof apiKeyCreateSchema>;

export const userSettingsSaveSchema = z.object({
  webhook_enabled: z.boolean().optional(),
  allowed_ips: z.array(z.string().trim().min(1)).optional(),
  telegram_enabled: z.boolean().optional(),
  telegram_channel_id: z.string().trim().optional(),
});

export type UserSettingsSaveInput = z.input<typeof userSettingsSaveSchema>;

export const userSettingsFormSchema = userSettingsSaveSchema;

export type UserSettingsFormInput = z.infer<typeof userSettingsFormSchema>;
