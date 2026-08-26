CREATE TABLE "broker_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"broker" text NOT NULL,
	"mode" text NOT NULL,
	"label" text,
	"credentials" text,
	"status" text DEFAULT 'unverified' NOT NULL,
	"verified_at" timestamp with time zone,
	"last_error" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"risk_per_trade" numeric(14, 2) NOT NULL,
	"capital" numeric(16, 2),
	"max_qty" integer,
	"max_position_value" numeric(16, 2),
	"max_open_positions" integer,
	"daily_loss_cap" numeric(14, 2),
	"max_signal_age_minutes" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broker_instruments" (
	"id" serial PRIMARY KEY NOT NULL,
	"broker" text NOT NULL,
	"exchange" text NOT NULL,
	"symbol" text NOT NULL,
	"broker_symbol" text,
	"broker_token" text,
	"lot_size" numeric(12, 4),
	"tick_size" numeric(12, 4),
	"instrument_class" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"connection_id" integer NOT NULL,
	"signal_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"qty" integer,
	"entry_price" numeric(18, 4),
	"broker_order_id" text,
	"stop_order_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_executions" ADD CONSTRAINT "order_executions_connection_id_broker_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."broker_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_executions" ADD CONSTRAINT "order_executions_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "broker_connections_user_idx" ON "broker_connections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "broker_instruments_unique" ON "broker_instruments" USING btree ("broker","exchange","symbol");--> statement-breakpoint
CREATE UNIQUE INDEX "order_executions_connection_signal_unique" ON "order_executions" USING btree ("connection_id","signal_id");--> statement-breakpoint
CREATE INDEX "order_executions_signal_idx" ON "order_executions" USING btree ("signal_id");