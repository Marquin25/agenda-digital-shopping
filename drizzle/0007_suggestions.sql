CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"category_id" integer,
	"device_hash" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suggestions_text_length" CHECK (char_length("suggestions"."text") between 1 and 500),
	CONSTRAINT "suggestions_status_valid" CHECK ("suggestions"."status" in ('new', 'read', 'archived'))
);
--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suggestions_status_created_idx" ON "suggestions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "suggestions_device_idx" ON "suggestions" USING btree ("device_hash");