import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewUser = typeof schema.users.$inferInsert;

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return user ?? null;
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user ?? null;
  }

  async create(data: NewUser) {
    const [user] = await this.db
      .insert(schema.users)
      .values(data)
      .returning();
    return user;
  }

  async findByLeague(leagueId: string, roles: string[]) {
    return this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.leagueId, leagueId),
          inArray(schema.users.role, roles as Array<typeof schema.users.role._.data>),
        ),
      )
      .orderBy(schema.users.createdAt);
  }

  async updateActive(userId: string, active: boolean, leagueId: string) {
    const [user] = await this.db
      .update(schema.users)
      .set({ active })
      .where(
        and(
          eq(schema.users.id, userId),
          eq(schema.users.leagueId, leagueId),
        ),
      )
      .returning();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
