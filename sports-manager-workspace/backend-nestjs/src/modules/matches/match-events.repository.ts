import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, or, between, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewMatchEvent = typeof schema.matchEvents.$inferInsert;

@Injectable()
export class MatchEventsRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: NewMatchEvent) {
    const [event] = await this.db
      .insert(schema.matchEvents)
      .values(data)
      .returning();
    return event;
  }

  async findById(eventId: string) {
    const [event] = await this.db
      .select()
      .from(schema.matchEvents)
      .where(eq(schema.matchEvents.id, eventId))
      .limit(1);
    return event ?? null;
  }

  async findByMatch(matchId: string) {
    return this.db
      .select()
      .from(schema.matchEvents)
      .where(eq(schema.matchEvents.matchId, matchId));
  }

  async findActiveByMatch(matchId: string) {
    return this.db
      .select()
      .from(schema.matchEvents)
      .where(
        and(
          eq(schema.matchEvents.matchId, matchId),
          isNull(schema.matchEvents.cancelledAt),
        ),
      );
  }

  async findByMatchWithPlayers(matchId: string) {
    return this.db
      .select({
        id: schema.matchEvents.id,
        matchId: schema.matchEvents.matchId,
        teamId: schema.matchEvents.teamId,
        playerId: schema.matchEvents.playerId,
        playerOutId: schema.matchEvents.playerOutId,
        eventType: schema.matchEvents.eventType,
        minute: schema.matchEvents.minute,
        createdAt: schema.matchEvents.createdAt,
        cancelledAt: schema.matchEvents.cancelledAt,
        playerName: schema.players.name,
        playerDorsal: schema.players.dorsal,
      })
      .from(schema.matchEvents)
      .leftJoin(schema.players, eq(schema.matchEvents.playerId, schema.players.id))
      .where(eq(schema.matchEvents.matchId, matchId));
  }

  async countYellowsByPlayer(matchId: string, playerId: string): Promise<number> {
    const rows = await this.db
      .select()
      .from(schema.matchEvents)
      .where(
        and(
          eq(schema.matchEvents.matchId, matchId),
          eq(schema.matchEvents.playerId, playerId),
          eq(schema.matchEvents.eventType, 'YELLOW_CARD'),
          isNull(schema.matchEvents.cancelledAt),
        ),
      );
    return rows.length;
  }

  async cancelById(eventId: string, cancelledById: string, reason: string) {
    const [event] = await this.db
      .update(schema.matchEvents)
      .set({
        cancelledAt: new Date(),
        cancelledById,
        cancelReason: reason,
      })
      .where(eq(schema.matchEvents.id, eventId))
      .returning();
    return event;
  }

  async countYellowsByPlayerInTournament(playerId: string, tournamentId: string): Promise<number> {
    // Find all match IDs for this tournament
    const tournamentMatches = await this.db
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(eq(schema.matches.tournamentId, tournamentId));

    if (tournamentMatches.length === 0) return 0;

    const matchIds = tournamentMatches.map((m) => m.id);

    const rows = await this.db
      .select()
      .from(schema.matchEvents)
      .where(
        and(
          inArray(schema.matchEvents.matchId, matchIds),
          eq(schema.matchEvents.playerId, playerId),
          eq(schema.matchEvents.eventType, 'YELLOW_CARD'),
          isNull(schema.matchEvents.cancelledAt),
        ),
      );
    return rows.length;
  }

  async findLinkedRed(matchId: string, playerId: string, minute: number) {
    const rows = await this.db
      .select()
      .from(schema.matchEvents)
      .where(
        and(
          eq(schema.matchEvents.matchId, matchId),
          eq(schema.matchEvents.playerId, playerId),
          eq(schema.matchEvents.eventType, 'RED_CARD'),
          isNull(schema.matchEvents.cancelledAt),
          or(
            eq(schema.matchEvents.minute, minute),
            eq(schema.matchEvents.minute, minute - 1),
            eq(schema.matchEvents.minute, minute + 1),
          ),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }
}
