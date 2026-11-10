CREATE TABLE "secret_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"secret_id" uuid NOT NULL,
	"environment_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_secret_version" UNIQUE("secret_id","version")
);
--> statement-breakpoint
ALTER TABLE "secrets" ADD COLUMN "current_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "secret_versions" ADD CONSTRAINT "fk_secret_versions_secret_id" FOREIGN KEY ("secret_id") REFERENCES "secrets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "secret_versions" ADD CONSTRAINT "fk_secret_versions_environment_id" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "secret_versions" ADD CONSTRAINT "fk_secret_versions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;