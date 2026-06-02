-- Feature: Player Suspensions
-- This migration activates suspension tracking for matches played AFTER this migration runs.
-- No backfill is performed. Historical matches before this migration will not generate suspension records.

-- Enums
CREATE TYPE "suspension_reason" AS ENUM ('YELLOW_ACCUMULATION', 'RED_CARD_DIRECT');
CREATE TYPE "suspension_status" AS ENUM ('PENDING', 'SERVED', 'CANCELLED');

-- New table
CREATE TABLE "player_suspensions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "player_id" uuid NOT NULL REFERENCES "players"("id"),
  "tournament_id" uuid NOT NULL REFERENCES "tournaments"("id"),
  "triggered_by_match_id" uuid NOT NULL REFERENCES "matches"("id"),
  "triggered_by_event_id" uuid REFERENCES "match_events"("id"),
  "reason" "suspension_reason" NOT NULL,
  "matches_suspended" integer NOT NULL DEFAULT 1,
  "matches_served" integer NOT NULL DEFAULT 0,
  "status" "suspension_status" NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "suspensions_player_tournament_idx" ON "player_suspensions" ("player_id", "tournament_id");
CREATE INDEX "suspensions_status_idx" ON "player_suspensions" ("status");

-- Tournament config columns
ALTER TABLE "tournaments" ADD COLUMN "yellows_for_suspension" integer NOT NULL DEFAULT 2;
ALTER TABLE "tournaments" ADD COLUMN "red_card_suspension_matches" integer NOT NULL DEFAULT 1;
