import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewFine = typeof schema.fines.$inferInsert;

@Injectable()
export class FinesRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: NewFine) {
    const [fine] = await this.db.insert(schema.fines).values(data).returning();
    return fine;
  }

  async findByMatch(matchId: string) {
    return this.db.select().from(schema.fines).where(eq(schema.fines.matchId, matchId));
  }

  async findByTeam(teamId: string) {
    return this.db.select().from(schema.fines).where(eq(schema.fines.teamId, teamId));
  }

  async findByTournament(tournamentId: string) {
    return this.db.select().from(schema.fines).where(eq(schema.fines.tournamentId, tournamentId));
  }

  async findById(id: string) {
    const [fine] = await this.db.select().from(schema.fines).where(eq(schema.fines.id, id)).limit(1);
    return fine ?? null;
  }

  async markAsPaid(id: string) {
    const [fine] = await this.db
      .update(schema.fines)
      .set({ status: 'PAID' })
      .where(eq(schema.fines.id, id))
      .returning();
    return fine;
  }
}
