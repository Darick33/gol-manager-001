import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentsRepository } from '../payments/payments.repository';
import { PdfService } from '../pdf/pdf.service';
import { TeamsRepository } from '../teams/teams.repository';
import { TournamentsRepository } from '../tournaments/tournaments.repository';
import { MatchEventsRepository } from './match-events.repository';
import { MatchesRepository } from './matches.repository';

@Injectable()
export class MatchesService {
  constructor(
    private matchesRepository: MatchesRepository,
    private matchEventsRepository: MatchEventsRepository,
    private tournamentsRepository: TournamentsRepository,
    private teamsRepository: TeamsRepository,
    private paymentsRepository: PaymentsRepository,
    private pdfService: PdfService,
  ) {}

  async generateActaPdf(matchId: string): Promise<Buffer> {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) throw new NotFoundException('Partido no encontrado');

    const [tournament, events, homeTeam, awayTeam, payments] = await Promise.all([
      this.tournamentsRepository.findById(match.tournamentId),
      this.matchEventsRepository.findByMatchWithPlayers(matchId),
      this.teamsRepository.findById(match.homeTeamId),
      this.teamsRepository.findById(match.awayTeamId),
      this.paymentsRepository.findByMatch(matchId),
    ]);

    return this.pdfService.generateActa({
      tournament: {
        name: tournament?.name ?? '',
        sportType: tournament?.sportType ?? '',
        yellowCardFine: tournament?.yellowCardFine ?? 0,
        redCardFine: tournament?.redCardFine ?? 0,
        courtFee: tournament?.courtFee ?? 0,
        refereeFee: tournament?.refereeFee ?? 0,
        refereeFeeEnabled: tournament?.refereeFeeEnabled ?? false,
      },
      match: {
        scheduledAt: match.scheduledAt,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeTeamName: homeTeam?.name ?? '',
        awayTeamName: awayTeam?.name ?? '',
        homeTeamColor: match.homeTeamColor ?? null,
        awayTeamColor: match.awayTeamColor ?? null,
        homeScore: match.homeScore ?? 0,
        awayScore: match.awayScore ?? 0,
      },
      events: events.map((e) => ({
        minute: e.minute,
        eventType: e.eventType,
        playerId: e.playerId ?? null,
        playerName: e.playerName ?? null,
        playerDorsal: e.playerDorsal ?? null,
        teamId: e.teamId,
      })),
      payments: payments.map((p) => ({
        teamId: p.teamId,
        method: p.method as 'CASH' | 'TRANSFER',
        amount: p.amount,
        status: p.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        receiptUrl: p.receiptUrl ?? null,
      })),
    });
  }
}
