ALTER TABLE "analyst_api_keys" ALTER COLUMN "secret_encrypted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "analyst_api_keys" DROP COLUMN "secret_hash";