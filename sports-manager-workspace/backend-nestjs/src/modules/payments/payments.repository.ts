import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
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

  async findPending(leagueId?: string) {
    if (!leagueId) {
      // PLATFORM_ADMIN: no filter, return all pending payments
      return this.db.select().from(schema.payments).where(eq(schema.payments.status, 'PENDING'));
    }
    return this.db
      .select({
        id: schema.payments.id,
        fineId: schema.payments.fineId,
        matchId: schema.payments.matchId,
        teamId: schema.payments.teamId,
        tournamentId: schema.payments.tournamentId,
        method: schema.payments.method,
        amount: schema.payments.amount,
        receiptUrl: schema.payments.receiptUrl,
        status: schema.payments.status,
        reviewedBy: schema.payments.reviewedBy,
        reviewedAt: schema.payments.reviewedAt,
        createdAt: schema.payments.createdAt,
      })
      .from(schema.payments)
      .innerJoin(schema.tournaments, eq(schema.payments.tournamentId, schema.tournaments.id))
      .where(
        and(
          eq(schema.payments.status, 'PENDING'),
          eq(schema.tournaments.leagueId, leagueId),
        ),
      );
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
