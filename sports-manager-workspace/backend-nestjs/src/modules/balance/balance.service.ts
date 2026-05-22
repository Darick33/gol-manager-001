import { Injectable } from '@nestjs/common';
import { BalanceRepository } from './balance.repository';

@Injectable()
export class BalanceService {
  constructor(private balanceRepository: BalanceRepository) {}

  chargeFine(params: {
    teamId: string;
    tournamentId: string;
    matchId: string;
    fineId: string;
    amount: number;
    reason: string;
  }) {
    return this.balanceRepository.recordEntry({
      teamId: params.teamId,
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      fineId: params.fineId,
      type: 'FINE_CHARGE',
      amount: -params.amount,
      description: `Multa: ${params.reason}`,
    });
  }

  chargeMatchFees(params: {
    teamId: string;
    tournamentId: string;
    matchId: string;
    courtFee: number;
    refereeFee: number;
    refereeFeeEnabled: boolean;
    opponentName: string;
  }) {
    const total = params.courtFee + (params.refereeFeeEnabled ? params.refereeFee : 0);
    if (total <= 0) return Promise.resolve(null);
    return this.balanceRepository.recordEntry({
      teamId: params.teamId,
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      type: 'MATCH_CHARGE',
      amount: -total,
      description: `Partido vs ${params.opponentName} — cancha${params.refereeFeeEnabled ? ' + árbitro' : ''}`,
    });
  }

  applyPayment(params: {
    teamId: string;
    tournamentId: string;
    matchId: string;
    paymentId: string;
    amount: number;
  }) {
    return this.balanceRepository.recordEntry({
      teamId: params.teamId,
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      paymentId: params.paymentId,
      type: 'PAYMENT_CREDIT',
      amount: params.amount,
      description: 'Pago registrado',
    });
  }

  getTeamBalance(teamId: string, tournamentId: string) {
    return this.balanceRepository.getBalance(teamId, tournamentId);
  }

  async getTeamSummary(teamId: string, tournamentId: string) {
    const [balance, ledger] = await Promise.all([
      this.balanceRepository.getBalance(teamId, tournamentId),
      this.balanceRepository.getLedger(teamId, tournamentId),
    ]);
    return { balance, ledger };
  }

  getTournamentBalances(tournamentId: string) {
    return this.balanceRepository.getAllForTournament(tournamentId);
  }
}
