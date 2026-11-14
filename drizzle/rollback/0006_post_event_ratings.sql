-- Reverts 0006_post_event_ratings. Every post-event rating and each event's rating period are lost:
-- back up first.
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_rating_period_days_range";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "rating_period_days";--> statement-breakpoint
DROP TABLE IF EXISTS "event_ratings";
