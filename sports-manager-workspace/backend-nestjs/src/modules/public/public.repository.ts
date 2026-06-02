import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class PublicRepository {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  getActiveTournaments() {
    return this.db
      .select()
      .from(schema.tournaments)
      .where(inArray(schema.tournaments.status, ['ACTIVE', 'FINISHED']));
  }

  async getTournamentBySlug(slug: string) {
    const [tournament] = await this.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.slug, slug))
      .limit(1);
    return tournament ?? null;
  }

  getTeamsByTournament(tournamentId: string) {
    return this.db
      .select({
        id: schema.teams.id,
        name: schema.teams.name,
        logoUrl: schema.teams.logoUrl,
        primaryColor: schema.teams.primaryColor,
        secondaryColor: schema.teams.secondaryColor,
      })
      .from(schema.teams)
      .where(eq(schema.teams.tournamentId, tournamentId));
  }

  getMatchesByTournament(tournamentId: string) {
    return this.db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.tournamentId, tournamentId));
  }

  getFinishedMatchesByTournament(tournamentId: string) {
    return this.db
      .select({
        homeTeamId: schema.matches.homeTeamId,
        awayTeamId: schema.matches.awayTeamId,
        homeScore: schema.matches.homeScore,
        awayScore: schema.matches.awayScore,
      })
      .from(schema.matches)
      .where(
        and(
          eq(schema.matches.tournamentId, tournamentId),
          eq(schema.matches.status, 'FINISHED'),
        ),
      );
  }

  getMatchIdsByTournament(tournamentId: string) {
    return this.db
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(eq(schema.matches.tournamentId, tournamentId));
  }

  getGoalEventsByMatches(matchIds: string[]) {
    return this.db
      .select({ playerId: schema.matchEvents.playerId, teamId: schema.matchEvents.teamId })
      .from(schema.matchEvents)
      .where(
        and(
          inArray(schema.matchEvents.matchId, matchIds),
          eq(schema.matchEvents.eventType, 'GOAL'),
        ),
      );
  }

  getPlayersByIds(playerIds: string[]) {
    return this.db
      .select({
        id: schema.players.id,
        name: schema.players.name,
        dorsal: schema.players.dorsal,
        photoUrl: schema.players.photoUrl,
        teamId: schema.players.teamId,
      })
      .from(schema.players)
      .where(inArray(schema.players.id, playerIds));
  }

  getTeamsByIds(teamIds: string[]) {
    return this.db
      .select({
        id: schema.teams.id,
        name: schema.teams.name,
        logoUrl: schema.teams.logoUrl,
        primaryColor: schema.teams.primaryColor,
      })
      .from(schema.teams)
      .where(inArray(schema.teams.id, teamIds));
  }

  getLiveMatches() {
    return this.db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.status, 'IN_PROGRESS'));
  }
}
