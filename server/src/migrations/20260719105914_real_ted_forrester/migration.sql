CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "secrets" DROP CONSTRAINT "secrets_value_key";--> statement-breakpoint
ALTER TABLE "secrets" DROP CONSTRAINT "secrets_key_key";--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "encrypted_dek" text NOT NULL;--> statement-breakpoint
ALTER TABLE "secrets" ALTER COLUMN "value" SET DATA TYPE text USING "value"::text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET DATA TYPE text USING "password_hash"::text;--> statement-breakpoint
ALTER TABLE "secrets" ADD CONSTRAINT "unique_env_secret_key" UNIQUE("environment_id","key");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "fk_api_keys_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "fk_api_keys_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id");