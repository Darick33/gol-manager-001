import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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
}
