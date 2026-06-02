import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewTournament = typeof schema.tournaments.$inferInsert;
type UpdateTournament = Partial<NewTournament>;

@Injectable()
export class TournamentsRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: NewTournament) {
    const [tournament] = await this.db
      .insert(schema.tournaments)
      .values(data)
      .returning();
    return tournament;
  }

  async findAll(leagueId: string) {
    return this.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.leagueId, leagueId));
  }

  async findAllGlobal() {
    return this.db.select().from(schema.tournaments);
  }

  async findBySlug(slug: string, leagueId?: string) {
    const conditions = leagueId
      ? and(eq(schema.tournaments.slug, slug), eq(schema.tournaments.leagueId, leagueId))
      : eq(schema.tournaments.slug, slug);
    const [tournament] = await this.db
      .select()
      .from(schema.tournaments)
      .where(conditions)
      .limit(1);
    return tournament ?? null;
  }

  async findById(id: string) {
    const [tournament] = await this.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, id))
      .limit(1);
    return tournament ?? null;
  }

  async update(id: string, data: UpdateTournament) {
    const [tournament] = await this.db
      .update(schema.tournaments)
      .set(data)
      .where(eq(schema.tournaments.id, id))
      .returning();
    return tournament;
  }
}
