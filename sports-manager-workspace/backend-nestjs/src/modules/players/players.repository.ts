import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewPlayer = typeof schema.players.$inferInsert;

@Injectable()
export class PlayersRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: NewPlayer) {
    const [player] = await this.db.insert(schema.players).values(data).returning();
    return player;
  }

  async findByTeam(teamId: string) {
    return this.db
      .select()
      .from(schema.players)
      .where(eq(schema.players.teamId, teamId));
  }

  async findById(id: string) {
    const [player] = await this.db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id))
      .limit(1);
    return player ?? null;
  }

  async update(id: string, data: Partial<NewPlayer>) {
    const [player] = await this.db
      .update(schema.players)
      .set(data)
      .where(eq(schema.players.id, id))
      .returning();
    return player;
  }

  async delete(id: string) {
    await this.db.delete(schema.players).where(eq(schema.players.id, id));
  }
}
