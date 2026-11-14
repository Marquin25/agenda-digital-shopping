CREATE TABLE "event_interest_totals" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"devices" integer NOT NULL,
	"frozen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_interests" (
	"event_id" uuid NOT NULL,
	"device_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_interests_event_id_device_hash_pk" PRIMARY KEY("event_id","device_hash")
);
--> statement-breakpoint
ALTER TABLE "event_interest_totals" ADD CONSTRAINT "event_interest_totals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_interests" ADD CONSTRAINT "event_interests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;