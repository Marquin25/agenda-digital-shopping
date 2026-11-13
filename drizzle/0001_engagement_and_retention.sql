CREATE TABLE "engagement_daily" (
	"event_id" uuid NOT NULL,
	"device_hash" text NOT NULL,
	"action" text NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_daily_totals" (
	"event_id" uuid NOT NULL,
	"action" text NOT NULL,
	"day" date NOT NULL,
	"devices" integer NOT NULL,
	CONSTRAINT "engagement_daily_totals_event_id_action_day_pk" PRIMARY KEY("event_id","action","day")
);
--> statement-breakpoint
CREATE TABLE "page_view_daily_totals" (
	"target_key" text NOT NULL,
	"event_id" uuid,
	"day" date NOT NULL,
	"channel" text NOT NULL,
	"devices" integer NOT NULL,
	CONSTRAINT "page_view_daily_totals_target_key_day_channel_pk" PRIMARY KEY("target_key","day","channel")
);
--> statement-breakpoint
ALTER TABLE "engagement_daily" ADD CONSTRAINT "engagement_daily_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_daily_totals" ADD CONSTRAINT "engagement_daily_totals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_view_daily_totals" ADD CONSTRAINT "page_view_daily_totals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "engagement_daily_unique" ON "engagement_daily" USING btree ("event_id","device_hash","action","day");--> statement-breakpoint
CREATE INDEX "engagement_daily_day_idx" ON "engagement_daily" USING btree ("day");