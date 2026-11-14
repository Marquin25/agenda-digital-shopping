CREATE TABLE "event_ratings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"device_hash" text,
	"score" integer NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comment" text,
	"with_check_in" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_ratings_score_range" CHECK ("event_ratings"."score" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "rating_period_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_ratings" ADD CONSTRAINT "event_ratings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_ratings_event_device_unique" ON "event_ratings" USING btree ("event_id","device_hash");--> statement-breakpoint
CREATE INDEX "event_ratings_event_idx" ON "event_ratings" USING btree ("event_id","created_at");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_rating_period_days_range" CHECK ("events"."rating_period_days" between 1 and 30);