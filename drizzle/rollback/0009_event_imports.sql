-- Reverts 0009_event_imports. Pending spreadsheet imports and every event's import code are lost
-- (the events themselves stay): back up first.
DROP INDEX IF EXISTS "events_import_code_unique";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "import_code";--> statement-breakpoint
DROP TABLE IF EXISTS "event_imports";
