import { z } from "zod";

export const subscribeSchema = z.object({
  analyst_id: z.string().trim().min(1, "analyst_id is required"),
});

export type SubscribeInput = z.input<typeof subscribeSchema>;
