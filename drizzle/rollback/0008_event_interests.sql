-- Reverts 0008_event_interests. Every "Tenho interesse" mark and the retained interest totals are lost:
-- back up first.
DROP TABLE IF EXISTS "event_interest_totals";--> statement-breakpoint
DROP TABLE IF EXISTS "event_interests";
