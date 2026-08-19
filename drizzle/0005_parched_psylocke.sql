ALTER TABLE "championship_config" ADD COLUMN "draw_seed" text;--> statement-breakpoint
ALTER TABLE "championship_config" ADD COLUMN "draw_team_order" jsonb;--> statement-breakpoint
ALTER TABLE "championship_config" ADD COLUMN "draw_confirmed_at" timestamp with time zone;