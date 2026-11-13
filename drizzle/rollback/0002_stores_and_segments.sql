-- Reverts 0002_stores_and_segments. Stores, segments and event links are lost: back up first.
DROP TABLE IF EXISTS "event_stores";--> statement-breakpoint
DROP TABLE IF EXISTS "stores";--> statement-breakpoint
DROP TABLE IF EXISTS "segments";
