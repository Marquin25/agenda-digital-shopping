-- Reverts 0003_experience_templates. The experience catalog is lost: back up first.
DROP TABLE IF EXISTS "experience_template_segments";--> statement-breakpoint
DROP TABLE IF EXISTS "experience_templates";
