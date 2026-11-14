CREATE TABLE "plan_segments" (
	"plan_id" uuid NOT NULL,
	"segment_id" integer NOT NULL,
	CONSTRAINT "plan_segments_plan_id_segment_id_pk" PRIMARY KEY("plan_id","segment_id")
);
--> statement-breakpoint
CREATE TABLE "plan_stores" (
	"plan_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	CONSTRAINT "plan_stores_plan_id_store_id_pk" PRIMARY KEY("plan_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "plan_venues" (
	"plan_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	CONSTRAINT "plan_venues_plan_id_venue_id_pk" PRIMARY KEY("plan_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"primary_objective" text NOT NULL,
	"secondary_objectives" text[] DEFAULT '{}' NOT NULL,
	"audiences" text[] DEFAULT '{}' NOT NULL,
	"interests" text[] DEFAULT '{}' NOT NULL,
	"budget_min" integer NOT NULL,
	"budget_max" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"preferred_weekdays" integer[] DEFAULT '{}' NOT NULL,
	"time_from" text,
	"time_to" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_segments" ADD CONSTRAINT "plan_segments_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_segments" ADD CONSTRAINT "plan_segments_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_stores" ADD CONSTRAINT "plan_stores_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_stores" ADD CONSTRAINT "plan_stores_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_venues" ADD CONSTRAINT "plan_venues_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_venues" ADD CONSTRAINT "plan_venues_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;