CREATE TABLE "event_imports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_by" uuid,
	"file_name" text NOT NULL,
	"rows" jsonb NOT NULL,
	"confirmed_at" timestamp with time zone,
	"summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "import_code" text;--> statement-breakpoint
ALTER TABLE "event_imports" ADD CONSTRAINT "event_imports_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_import_code_unique" ON "events" USING btree ("import_code");