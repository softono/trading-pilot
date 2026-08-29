import { z } from "zod";
import {
  BROKER,
  BROKER_MODE,
  BROKER_SUPPORTED_MODES,
} from "@/modules/broker/broker.constants";

export const brokerSchema = z.enum([
  BROKER.GROWW,
  BROKER.DHAN,
  BROKER.DELTA,
  BROKER.ANGELONE,
  BROKER.PAPER,
]);

export const brokerModeSchema = z.enum([
  BROKER_MODE.LIVE,
  BROKER_MODE.SANDBOX,
  BROKER_MODE.PAPER,
]);

export const brokerConnectionSaveSchema = z
  .object({
    broker: brokerSchema,
    mode: brokerModeSchema,
    label: z.string().trim().max(80).optional(),
    credentials: z.record(z.string(), z.string()).optional(),
    risk_per_trade: z.number().positive("Must be greater than 0"),
    capital: z.number().positive().optional(),
    max_qty: z.number().int().positive().optional(),
    max_position_value: z.number().positive().optional(),
    max_open_positions: z.number().int().positive().optional(),
    daily_loss_cap: z.number().positive().optional(),
    max_signal_age_minutes: z.number().int().positive().max(1440),
  })
  .superRefine((data, ctx) => {
    if (!BROKER_SUPPORTED_MODES[data.broker]?.includes(data.mode)) {
      ctx.addIssue({
        code: "custom",
        path: ["mode"],
        message: `${data.broker} does not support ${data.mode} mode`,
      });
    }
    if (data.broker !== BROKER.PAPER && !data.credentials) {
      ctx.addIssue({
        code: "custom",
        path: ["credentials"],
        message: "Credentials are required for this broker",
      });
    }
  });

export type BrokerConnectionSaveInput = z.input<
  typeof brokerConnectionSaveSchema
>;

export const brokerConnectionFormSchema = brokerConnectionSaveSchema;

export type BrokerConnectionFormInput = z.infer<
  typeof brokerConnectionFormSchema
>;
