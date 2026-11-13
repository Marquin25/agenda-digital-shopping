CREATE TABLE "event_stores" (
	"event_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	CONSTRAINT "event_stores_event_id_store_id_pk" PRIMARY KEY("event_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "segments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"segment_id" integer NOT NULL,
	"floor" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_stores" ADD CONSTRAINT "event_stores_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_stores" ADD CONSTRAINT "event_stores_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_stores_store_idx" ON "event_stores" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "stores_segment_idx" ON "stores" USING btree ("segment_id");