import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewSuspension = {
  playerId: string;
  tournamentId: string;
  triggeredByMatchId: string;
  triggeredByEventId?: string;
  reason: 'YELLOW_ACCUMULATION' | 'RED_CARD_DIRECT';
  matchesSuspended: number;
};

@Injectable()
export class SuspensionsRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: NewSuspension) {
    const [suspension] = await this.db
      .insert(schema.playerSuspensions)
      .values({
        playerId: data.playerId,
        tournamentId: data.tournamentId,
        triggeredByMatchId: data.triggeredByMatchId,
        triggeredByEventId: data.triggeredByEventId ?? null,
        reason: data.reason,
        matchesSuspended: data.matchesSuspended,
      })
      .returning();
    return suspension;
  }

  async findPendingByPlayerAndTournament(playerId: string, tournamentId: string) {
    const [suspension] = await this.db
      .select()
      .from(schema.playerSuspensions)
      .where(
        and(
          eq(schema.playerSuspensions.playerId, playerId),
          eq(schema.playerSuspensions.tournamentId, tournamentId),
          eq(schema.playerSuspensions.status, 'PENDING'),
        ),
      )
      .limit(1);
    return suspension ?? null;
  }

  async findPendingByTournament(tournamentId: string) {
    return this.db
      .select({
        id: schema.playerSuspensions.id,
        playerId: schema.playerSuspensions.playerId,
        tournamentId: schema.playerSuspensions.tournamentId,
        triggeredByMatchId: schema.playerSuspensions.triggeredByMatchId,
        triggeredByEventId: schema.playerSuspensions.triggeredByEventId,
        reason: schema.playerSuspensions.reason,
        matchesSuspended: schema.playerSuspensions.matchesSuspended,
        matchesServed: schema.playerSuspensions.matchesServed,
        status: schema.playerSuspensions.status,
        createdAt: schema.playerSuspensions.createdAt,
        updatedAt: schema.playerSuspensions.updatedAt,
        playerName: schema.players.name,
        playerDorsal: schema.players.dorsal,
        teamId: schema.teams.id,
        teamName: schema.teams.name,
      })
      .from(schema.playerSuspensions)
      .leftJoin(schema.players, eq(schema.playerSuspensions.playerId, schema.players.id))
      .leftJoin(schema.teams, eq(schema.players.teamId, schema.teams.id))
      .where(
        and(
          eq(schema.playerSuspensions.tournamentId, tournamentId),
          eq(schema.playerSuspensions.status, 'PENDING'),
        ),
      );
  }

  async markAsServed(id: string) {
    const [suspension] = await this.db
      .update(schema.playerSuspensions)
      .set({
        status: 'SERVED',
        matchesServed: sql`${schema.playerSuspensions.matchesServed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.playerSuspensions.id, id))
      .returning();
    return suspension;
  }

  async cancel(id: string) {
    const [suspension] = await this.db
      .update(schema.playerSuspensions)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(schema.playerSuspensions.id, id))
      .returning();
    return suspension;
  }
}
