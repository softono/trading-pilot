ALTER TABLE "analyst_api_keys" ALTER COLUMN "secret_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "analyst_api_keys" ADD COLUMN "secret_encrypted" text;