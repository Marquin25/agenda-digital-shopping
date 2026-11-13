-- Reverts 0000_initial: drops every Phase 1 table. ALL DATA IS LOST: back up first.
DROP TABLE IF EXISTS "promo_link_hits_daily";--> statement-breakpoint
DROP TABLE IF EXISTS "promo_links";--> statement-breakpoint
DROP TABLE IF EXISTS "page_views_raw_daily";--> statement-breakpoint
DROP TABLE IF EXISTS "page_views_daily";--> statement-breakpoint
DROP TABLE IF EXISTS "event_accessibility_features";--> statement-breakpoint
DROP TABLE IF EXISTS "events";--> statement-breakpoint
DROP TABLE IF EXISTS "venues";--> statement-breakpoint
DROP TABLE IF EXISTS "categories";--> statement-breakpoint
DROP TABLE IF EXISTS "accessibility_features";--> statement-breakpoint
DROP TABLE IF EXISTS "audit_log";--> statement-breakpoint
DROP TABLE IF EXISTS "admin_sessions";--> statement-breakpoint
DROP TABLE IF EXISTS "admin_users";
