import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewMatch = typeof schema.matches.$inferInsert;

@Injectable()
export class MatchesRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async bulkCreate(data: NewMatch[]) {
    return this.db.insert(schema.matches).values(data).returning();
  }

  async findByTournament(tournamentId: string) {
    return this.db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.tournamentId, tournamentId));
  }

  async findById(id: string) {
    const [match] = await this.db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, id))
      .limit(1);
    return match ?? null;
  }

  async findInProgress() {
    return this.db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.status, 'IN_PROGRESS'));
  }

  async updateTimer(id: string, seconds: number, running: boolean, currentHalf: number) {
    await this.db
      .update(schema.matches)
      .set({ timerSeconds: seconds, timerRunning: running, currentHalf })
      .where(eq(schema.matches.id, id));
  }

  async updateStatus(id: string, status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED') {
    const [match] = await this.db
      .update(schema.matches)
      .set({ status })
      .where(eq(schema.matches.id, id))
      .returning();
    return match;
  }

  async updateColors(id: string, homeColor: string, awayColor: string) {
    const [match] = await this.db
      .update(schema.matches)
      .set({ homeTeamColor: homeColor, awayTeamColor: awayColor })
      .where(eq(schema.matches.id, id))
      .returning();
    return match;
  }

  async updateScore(id: string, homeScore: number, awayScore: number) {
    await this.db
      .update(schema.matches)
      .set({ homeScore, awayScore })
      .where(eq(schema.matches.id, id));
  }

  async updateScheduledAt(id: string, scheduledAt: Date | null) {
    const [match] = await this.db
      .update(schema.matches)
      .set({ scheduledAt })
      .where(eq(schema.matches.id, id))
      .returning();
    return match;
  }

  async closeMatch(id: string, actaPdfUrl?: string) {
    const [match] = await this.db
      .update(schema.matches)
      .set({ status: 'FINISHED', timerRunning: false, actaPdfUrl })
      .where(eq(schema.matches.id, id))
      .returning();
    return match;
  }
}
