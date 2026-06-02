ALTER TABLE "tournament_rounds" DROP CONSTRAINT "tournament_rounds_tournament_id_tournaments_id_fk";
--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "logo_bg_removed_url" text;--> statement-breakpoint
ALTER TABLE "tournament_rounds" ADD CONSTRAINT "tournament_rounds_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "balance_ledger_team_tournament_idx" ON "balance_ledger" USING btree ("team_id","tournament_id");--> statement-breakpoint
CREATE INDEX "fines_team_id_idx" ON "fines" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "fines_tournament_id_idx" ON "fines" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "fines_match_id_idx" ON "fines" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "fines_status_idx" ON "fines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "match_events_match_id_idx" ON "match_events" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "match_events_player_id_idx" ON "match_events" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "match_events_event_type_idx" ON "match_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "match_events_match_player_idx" ON "match_events" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE INDEX "matches_tournament_id_idx" ON "matches" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_home_team_id_idx" ON "matches" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "matches_away_team_id_idx" ON "matches" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "payments_team_id_idx" ON "payments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "payments_tournament_id_idx" ON "payments" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "payments_match_id_idx" ON "payments" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "payments_fine_id_idx" ON "payments" USING btree ("fine_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "players_team_id_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "teams_tournament_id_idx" ON "teams" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "teams_delegate_id_idx" ON "teams" USING btree ("delegate_id");