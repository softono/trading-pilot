CREATE TABLE "analyst_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key_id" text NOT NULL,
	"secret_hash" text NOT NULL,
	"label" text,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"signal_id" integer NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"analyst_id" text NOT NULL,
	"logical_signal_id" uuid NOT NULL,
	"revision_no" integer DEFAULT 1 NOT NULL,
	"symbol" text NOT NULL,
	"company_name" text,
	"exchange" text,
	"market" text NOT NULL,
	"instrument_class" text NOT NULL,
	"side" text NOT NULL,
	"horizon" text,
	"timeframe" text,
	"setup_code" text,
	"entry" numeric(18, 4) NOT NULL,
	"stop_loss" numeric(18, 4) NOT NULL,
	"targets" jsonb DEFAULT '[]'::jsonb,
	"risk_score" numeric(5, 2),
	"confidence" numeric(5, 2),
	"ai_confidence" numeric(5, 2),
	"event_risk" boolean DEFAULT false,
	"ttl_expires_at" timestamp with time zone,
	"thesis_pack" jsonb DEFAULT '{}'::jsonb,
	"key_risks" jsonb DEFAULT '[]'::jsonb,
	"evidence" jsonb DEFAULT '{}'::jsonb,
	"status" text NOT NULL,
	"detected_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"invalidation_reason" text,
	"exit_price" numeric(18, 4),
	"exit_reason" text,
	"return_pct" numeric(8, 4),
	"r_multiple" numeric(8, 4),
	"closed_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"telegram_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"webhook_enabled" boolean DEFAULT true NOT NULL,
	"allowed_ips" jsonb DEFAULT '[]'::jsonb,
	"telegram_enabled" boolean DEFAULT false NOT NULL,
	"telegram_channel_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_id" text,
	"ip" text,
	"event" text,
	"logical_signal_id" uuid,
	"http_status" integer NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analyst_api_keys" ADD CONSTRAINT "analyst_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_events" ADD CONSTRAINT "signal_events_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_analyst_id_users_id_fk" FOREIGN KEY ("analyst_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "analyst_api_keys_key_id_unique" ON "analyst_api_keys" USING btree ("key_id");--> statement-breakpoint
CREATE INDEX "analyst_api_keys_user_idx" ON "analyst_api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "signal_events_signal_idx" ON "signal_events" USING btree ("signal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "signals_analyst_logical_unique" ON "signals" USING btree ("analyst_id","logical_signal_id");--> statement-breakpoint
CREATE INDEX "signals_analyst_published_idx" ON "signals" USING btree ("analyst_id","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "signals_status_idx" ON "signals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_settings_user_unique" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_logs_key_idx" ON "webhook_logs" USING btree ("key_id");