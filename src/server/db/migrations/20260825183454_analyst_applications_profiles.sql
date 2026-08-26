CREATE TYPE "public"."analyst_type" AS ENUM('ai', 'human');--> statement-breakpoint
CREATE TYPE "public"."analyst_application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "analyst_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pitch" text NOT NULL,
	"experience_years" integer,
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"website" text,
	"status" "analyst_application_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyst_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"headline" text,
	"bio" text,
	"avatar" text,
	"analyst_type" "analyst_type" DEFAULT 'human' NOT NULL,
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"socials" jsonb DEFAULT '{}'::jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analyst_applications" ADD CONSTRAINT "analyst_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyst_applications" ADD CONSTRAINT "analyst_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyst_profiles" ADD CONSTRAINT "analyst_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analyst_applications_user_idx" ON "analyst_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analyst_applications_status_idx" ON "analyst_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "analyst_profiles_user_unique" ON "analyst_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "analyst_profiles_slug_unique" ON "analyst_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "analyst_profiles_type_idx" ON "analyst_profiles" USING btree ("analyst_type");