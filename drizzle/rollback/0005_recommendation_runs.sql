-- Reverts 0005_recommendation_runs. Recorded recommendation runs and the links from events to their
-- brief and catalog idea are lost (the events themselves stay): back up first.
DROP INDEX IF EXISTS "events_experience_template_idx";--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_experience_template_id_experience_templates_id_fk";--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_plan_id_plans_id_fk";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "experience_template_id";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "plan_id";--> statement-breakpoint
DROP TABLE IF EXISTS "recommendation_runs";
