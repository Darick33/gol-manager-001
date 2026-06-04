import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewLeague = typeof schema.leagues.$inferInsert;

@Injectable()
export class LeaguesRepository {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async create(data: Pick<NewLeague, 'name' | 'slug' | 'subdomain' | 'logoUrl'>) {
    const [league] = await this.db
      .insert(schema.leagues)
      .values(data)
      .returning();
    return league;
  }

  async findAll() {
    return this.db.select().from(schema.leagues);
  }

  async findById(id: string) {
    const [league] = await this.db
      .select()
      .from(schema.leagues)
      .where(eq(schema.leagues.id, id))
      .limit(1);
    return league ?? null;
  }

  async findBySlug(slug: string) {
    const [league] = await this.db
      .select()
      .from(schema.leagues)
      .where(eq(schema.leagues.slug, slug))
      .limit(1);
    return league ?? null;
  }

  async findBySubdomain(subdomain: string) {
    const [league] = await this.db
      .select()
      .from(schema.leagues)
      .where(eq(schema.leagues.subdomain, subdomain))
      .limit(1);
    return league ?? null;
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    const [league] = await this.db
      .update(schema.leagues)
      .set({ status })
      .where(eq(schema.leagues.id, id))
      .returning();
    return league ?? null;
  }
}
