import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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

  async findAll() {
    return this.db.select().from(schema.tournaments);
  }

  async findBySlug(slug: string) {
    const [tournament] = await this.db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.slug, slug))
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
