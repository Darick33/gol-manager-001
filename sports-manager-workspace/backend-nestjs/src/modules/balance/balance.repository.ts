import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, and, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

export interface LedgerEntryInput {
  teamId: string;
  tournamentId: string;
  matchId?: string | null;
  fineId?: string | null;
  paymentId?: string | null;
  type: 'MATCH_CHARGE' | 'FINE_CHARGE' | 'PAYMENT_CREDIT' | 'ADJUSTMENT';
  amount: number; // negative = debit, positive = credit
  description: string;
}

@Injectable()
export class BalanceRepository {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async recordEntry(input: LedgerEntryInput) {
    const [entry] = await this.db
      .insert(schema.balanceLedger)
      .values(input)
      .returning();

    await this.db
      .insert(schema.teamBalances)
      .values({ teamId: input.teamId, tournamentId: input.tournamentId, balance: input.amount })
      .onConflictDoUpdate({
        target: [schema.teamBalances.teamId, schema.teamBalances.tournamentId],
        set: {
          balance: sql`${schema.teamBalances.balance} + ${input.amount}`,
          updatedAt: new Date(),
        },
      });

    return entry;
  }

  async getBalance(teamId: string, tournamentId: string): Promise<number> {
    const [row] = await this.db
      .select({ balance: schema.teamBalances.balance })
      .from(schema.teamBalances)
      .where(and(
        eq(schema.teamBalances.teamId, teamId),
        eq(schema.teamBalances.tournamentId, tournamentId),
      ))
      .limit(1);
    return row?.balance ?? 0;
  }

  async getLedger(teamId: string, tournamentId: string) {
    return this.db
      .select()
      .from(schema.balanceLedger)
      .where(and(
        eq(schema.balanceLedger.teamId, teamId),
        eq(schema.balanceLedger.tournamentId, tournamentId),
      ))
      .orderBy(desc(schema.balanceLedger.createdAt));
  }

  async getAllForTournament(tournamentId: string) {
    return this.db
      .select()
      .from(schema.teamBalances)
      .where(eq(schema.teamBalances.tournamentId, tournamentId))
      .orderBy(schema.teamBalances.balance);
  }
}
