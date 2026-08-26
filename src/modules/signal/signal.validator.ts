import { z } from "zod";
import {
  WEBHOOK_EVENT,
  SIGNAL_SIDE,
  SIGNAL_STATUS,
} from "@/modules/signal/signal.constants";

const numericString = z
  .union([z.number(), z.string()])
  .transform((v) => String(v));

export const signalWebhookSchema = z.object({
  event: z.enum([WEBHOOK_EVENT.PUBLISHED, WEBHOOK_EVENT.UPDATED]),
  logical_signal_id: z.string().uuid("logical_signal_id must be a UUID"),
  revision_no: z.number().int().min(1),

  symbol: z.string().trim().min(1),
  company_name: z.string().trim().optional(),
  exchange: z.string().trim().optional(),
  market: z.string().trim().min(1),
  instrument_class: z.string().trim().min(1),
  side: z.enum([SIGNAL_SIDE.LONG, SIGNAL_SIDE.SHORT]),
  horizon: z.string().trim().optional(),
  timeframe: z.string().trim().optional(),
  setup_code: z.string().trim().optional(),

  entry: numericString,
  stop_loss: numericString,
  targets: z.array(z.record(z.string(), z.unknown())).default([]),

  risk_score: numericString.optional(),
  confidence: numericString.optional(),
  ai_confidence: numericString.optional(),
  event_risk: z.boolean().optional(),
  ttl_expires_at: z.string().datetime({ offset: true }).optional(),

  thesis_pack: z.record(z.string(), z.unknown()).optional(),
  key_risks: z.array(z.string()).optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),

  status: z.enum([
    SIGNAL_STATUS.PUBLISHED,
    SIGNAL_STATUS.ACTIVE,
    SIGNAL_STATUS.TARGET_REACHED,
    SIGNAL_STATUS.STOPPED,
    SIGNAL_STATUS.FAILED,
    SIGNAL_STATUS.EXPIRED,
  ]),
  detected_at: z.string().datetime({ offset: true }).optional(),
  published_at: z.string().datetime({ offset: true }).optional(),
  invalidated_at: z.string().datetime({ offset: true }).optional(),
  invalidation_reason: z.string().trim().optional(),

  exit_price: numericString.optional(),
  exit_reason: z.string().trim().optional(),
  closed_at: z.string().datetime({ offset: true }).optional(),
});

export type SignalWebhookInput = z.infer<typeof signalWebhookSchema>;
