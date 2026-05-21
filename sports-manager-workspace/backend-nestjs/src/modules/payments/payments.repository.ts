import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

type NewPayment = typeof schema.payments.$inferInsert;

@Injectable()
export class PaymentsRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(data: NewPayment) {
    const [payment] = await this.db.insert(schema.payments).values(data).returning();
    return payment;
  }

  async findByTeam(teamId: string) {
    return this.db.select().from(schema.payments).where(eq(schema.payments.teamId, teamId));
  }

  async findPending() {
    return this.db.select().from(schema.payments).where(eq(schema.payments.status, 'PENDING'));
  }

  async findById(id: string) {
    const [payment] = await this.db.select().from(schema.payments).where(eq(schema.payments.id, id)).limit(1);
    return payment ?? null;
  }

  async findByMatch(matchId: string) {
    return this.db.select().from(schema.payments).where(eq(schema.payments.matchId, matchId));
  }

  async review(id: string, status: 'APPROVED' | 'REJECTED', reviewedBy: string) {
    const [payment] = await this.db
      .update(schema.payments)
      .set({ status, reviewedBy, reviewedAt: new Date() })
      .where(eq(schema.payments.id, id))
      .returning();
    return payment;
  }
}
