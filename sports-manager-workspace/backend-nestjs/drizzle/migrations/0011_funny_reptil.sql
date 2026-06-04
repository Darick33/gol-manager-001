CREATE TYPE "public"."league_status" AS ENUM('ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."suspension_reason" AS ENUM('YELLOW_ACCUMULATION', 'RED_CARD_DIRECT');--> statement-breakpoint
CREATE TYPE "public"."suspension_status" AS ENUM('PENDING', 'SERVED', 'CANCELLED');--> statement-breakpoint
ALTER TYPE "public"."balance_ledger_type" ADD VALUE 'FINE_REVERSAL';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'PLATFORM_ADMIN' BEFORE 'SUPER_ADMIN';--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"subdomain" varchar(100),
	"logo_url" text,
	"status" "league_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_suspensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"tournament_id" uuid NOT NULL,
	"triggered_by_match_id" uuid NOT NULL,
	"triggered_by_event_id" uuid,
	"reason" "suspension_reason" NOT NULL,
	"matches_suspended" integer DEFAULT 1 NOT NULL,
	"matches_served" integer DEFAULT 0 NOT NULL,
	"status" "suspension_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tournaments" DROP CONSTRAINT "tournaments_slug_unique";--> statement-breakpoint
ALTER TABLE "fines" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "cancelled_by_id" uuid;--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "cancel_reason" varchar(100);--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "league_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "yellows_for_suspension" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "red_card_suspension_matches" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "league_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "player_suspensions" ADD CONSTRAINT "player_suspensions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_suspensions" ADD CONSTRAINT "player_suspensions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_suspensions" ADD CONSTRAINT "player_suspensions_triggered_by_match_id_matches_id_fk" FOREIGN KEY ("triggered_by_match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_suspensions" ADD CONSTRAINT "player_suspensions_triggered_by_event_id_match_events_id_fk" FOREIGN KEY ("triggered_by_event_id") REFERENCES "public"."match_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leagues_slug_unique_idx" ON "leagues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "suspensions_player_tournament_idx" ON "player_suspensions" USING btree ("player_id","tournament_id");--> statement-breakpoint
CREATE INDEX "suspensions_status_idx" ON "player_suspensions" USING btree ("status");--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tournaments_slug_league_idx" ON "tournaments" USING btree ("slug","league_id");--> statement-breakpoint
CREATE INDEX "tournaments_league_id_idx" ON "tournaments" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "users_league_id_idx" ON "users" USING btree ("league_id");