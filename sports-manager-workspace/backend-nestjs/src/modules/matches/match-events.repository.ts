import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
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

  async findByMatch(matchId: string) {
    return this.db
      .select()
      .from(schema.matchEvents)
      .where(eq(schema.matchEvents.matchId, matchId));
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
        ),
      );
    return rows.length;
  }
}
