CREATE TABLE "accessibility_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	CONSTRAINT "accessibility_features_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_accessibility_features" (
	"event_id" uuid NOT NULL,
	"feature_id" integer NOT NULL,
	CONSTRAINT "event_accessibility_features_event_id_feature_id_pk" PRIMARY KEY("event_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"search_text" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"venue_id" uuid NOT NULL,
	"location_detail" text DEFAULT '' NOT NULL,
	"category_id" integer NOT NULL,
	"banner_path" text,
	"banner_alt" text,
	"admission_info" text DEFAULT '' NOT NULL,
	"capacity_mode" text DEFAULT 'unlimited' NOT NULL,
	"displayed_capacity" integer,
	"publication_status" text DEFAULT 'draft' NOT NULL,
	"ics_sequence" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_views_daily" (
	"target_key" text NOT NULL,
	"event_id" uuid,
	"day" date NOT NULL,
	"device_hash" text NOT NULL,
	"channel" text NOT NULL,
	"promo_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views_raw_daily" (
	"target_key" text NOT NULL,
	"event_id" uuid,
	"day" date NOT NULL,
	"channel" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "page_views_raw_daily_target_key_day_channel_pk" PRIMARY KEY("target_key","day","channel")
);
--> statement-breakpoint
CREATE TABLE "promo_link_hits_daily" (
	"promo_link_id" uuid NOT NULL,
	"day" date NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "promo_link_hits_daily_promo_link_id_day_pk" PRIMARY KEY("promo_link_id","day")
);
--> statement-breakpoint
CREATE TABLE "promo_links" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"channel" text NOT NULL,
	"description" text NOT NULL,
	"event_id" uuid,
	"agenda_query" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"floor" text DEFAULT '' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"area_square_meters" integer,
	"capacity" integer,
	"facilities" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_accessibility_features" ADD CONSTRAINT "event_accessibility_features_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_accessibility_features" ADD CONSTRAINT "event_accessibility_features_feature_id_accessibility_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."accessibility_features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views_daily" ADD CONSTRAINT "page_views_daily_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views_raw_daily" ADD CONSTRAINT "page_views_raw_daily_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_link_hits_daily" ADD CONSTRAINT "promo_link_hits_daily_promo_link_id_promo_links_id_fk" FOREIGN KEY ("promo_link_id") REFERENCES "public"."promo_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_links" ADD CONSTRAINT "promo_links_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_links" ADD CONSTRAINT "promo_links_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_user_idx" ON "admin_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "page_views_daily_unique" ON "page_views_daily" USING btree ("target_key","day","device_hash");--> statement-breakpoint
CREATE INDEX "page_views_daily_day_idx" ON "page_views_daily" USING btree ("day");