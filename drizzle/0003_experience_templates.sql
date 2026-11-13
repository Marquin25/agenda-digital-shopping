CREATE TABLE "experience_template_segments" (
	"template_id" uuid NOT NULL,
	"segment_id" integer NOT NULL,
	CONSTRAINT "experience_template_segments_template_id_segment_id_pk" PRIMARY KEY("template_id","segment_id")
);
--> statement-breakpoint
CREATE TABLE "experience_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"objective_weights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"audience_weights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cost_min" integer NOT NULL,
	"cost_max" integer NOT NULL,
	"min_area_square_meters" integer,
	"min_capacity" integer,
	"facilities" text[] DEFAULT '{}' NOT NULL,
	"duration_minutes" integer NOT NULL,
	"category_id" integer,
	"indicators" text[] DEFAULT '{}' NOT NULL,
	"review_status" text DEFAULT 'draft' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experience_template_segments" ADD CONSTRAINT "experience_template_segments_template_id_experience_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."experience_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_template_segments" ADD CONSTRAINT "experience_template_segments_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_templates" ADD CONSTRAINT "experience_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "experience_template_segments_segment_idx" ON "experience_template_segments" USING btree ("segment_id");