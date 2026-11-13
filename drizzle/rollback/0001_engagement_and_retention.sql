-- Reverts 0001_engagement_and_retention. Retained totals are lost: back up first.
DROP TABLE IF EXISTS "page_view_daily_totals";--> statement-breakpoint
DROP TABLE IF EXISTS "engagement_daily_totals";--> statement-breakpoint
DROP TABLE IF EXISTS "engagement_daily";
