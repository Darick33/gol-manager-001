import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewTeam = typeof schema.teams.$inferInsert;

@Injectable()
export class TeamsRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: NewTeam) {
    const [team] = await this.db.insert(schema.teams).values(data).returning();
    return team;
  }

  async findByTournament(tournamentId: string) {
    return this.db
      .select()
      .from(schema.teams)
      .where(eq(schema.teams.tournamentId, tournamentId));
  }

  async findById(id: string) {
    const [team] = await this.db
      .select()
      .from(schema.teams)
      .where(eq(schema.teams.id, id))
      .limit(1);
    return team ?? null;
  }

  async update(id: string, data: Partial<NewTeam>) {
    const [team] = await this.db
      .update(schema.teams)
      .set(data)
      .where(eq(schema.teams.id, id))
      .returning();
    return team;
  }
}
