import { z } from "zod";
import { emailField } from "@/modules/account/user.fields";

export const loginLinkCreateSchema = z.object({
  email: emailField,
  remember: z.boolean().default(false),
});
export type LoginLinkCreateInput = z.input<typeof loginLinkCreateSchema>;

export const loginLinkPollSchema = z.object({
  requestId: z.string({ error: "requestId is required" }),
  pollToken: z.string({ error: "pollToken is required" }),
});
export type LoginLinkPollInput = z.input<typeof loginLinkPollSchema>;

export const loginLinkApproveSchema = z.object({
  requestId: z.string({ error: "requestId is required" }),
  token: z.string({ error: "token is required" }),
  action: z.enum(["approve", "reject"]),
});
export type LoginLinkApproveInput = z.input<typeof loginLinkApproveSchema>;

export const loginLinkEmailFormSchema = z.object({
  email: emailField,
});
export type LoginLinkEmailFormInput = z.infer<typeof loginLinkEmailFormSchema>;
