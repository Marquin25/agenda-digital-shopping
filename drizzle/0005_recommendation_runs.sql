CREATE TABLE "recommendation_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"plan_id" uuid NOT NULL,
	"rules_version" text NOT NULL,
	"weights" jsonb NOT NULL,
	"input" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "experience_template_id" uuid;--> statement-breakpoint
ALTER TABLE "recommendation_runs" ADD CONSTRAINT "recommendation_runs_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_runs" ADD CONSTRAINT "recommendation_runs_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recommendation_runs_plan_idx" ON "recommendation_runs" USING btree ("plan_id","created_at");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_experience_template_id_experience_templates_id_fk" FOREIGN KEY ("experience_template_id") REFERENCES "public"."experience_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_experience_template_idx" ON "events" USING btree ("experience_template_id");