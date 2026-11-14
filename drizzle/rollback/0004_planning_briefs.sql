-- Reverts 0004_planning_briefs. Planning briefs and their links are lost: back up first.
DROP TABLE IF EXISTS "plan_venues";--> statement-breakpoint
DROP TABLE IF EXISTS "plan_stores";--> statement-breakpoint
DROP TABLE IF EXISTS "plan_segments";--> statement-breakpoint
DROP TABLE IF EXISTS "plans";
