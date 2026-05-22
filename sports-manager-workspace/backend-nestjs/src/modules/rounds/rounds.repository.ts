import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class RoundsRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  findByTournament(tournamentId: string) {
    return this.db
      .select()
      .from(schema.tournamentRounds)
      .where(eq(schema.tournamentRounds.tournamentId, tournamentId));
  }

  async findByStage(tournamentId: string, stage: number) {
    const [row] = await this.db
      .select()
      .from(schema.tournamentRounds)
      .where(
        and(
          eq(schema.tournamentRounds.tournamentId, tournamentId),
          eq(schema.tournamentRounds.stage, stage),
        ),
      );
    return row ?? null;
  }

  async closeRound(tournamentId: string, stage: number, closedById: string) {
    const existing = await this.findByStage(tournamentId, stage);
    if (existing) {
      const [updated] = await this.db
        .update(schema.tournamentRounds)
        .set({ status: 'CLOSED', closedAt: new Date(), closedById })
        .where(eq(schema.tournamentRounds.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await this.db
      .insert(schema.tournamentRounds)
      .values({ tournamentId, stage, status: 'CLOSED', closedAt: new Date(), closedById })
      .returning();
    return created;
  }

  async isRoundClosed(tournamentId: string, stage: number): Promise<boolean> {
    const row = await this.findByStage(tournamentId, stage);
    return row?.status === 'CLOSED';
  }
}
