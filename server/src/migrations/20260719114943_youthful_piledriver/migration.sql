ALTER TABLE "api_keys" ADD COLUMN "rate_limit" integer DEFAULT 60;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "request_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "last_used_at" timestamp;