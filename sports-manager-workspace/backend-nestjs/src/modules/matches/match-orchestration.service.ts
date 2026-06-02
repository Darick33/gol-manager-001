import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FinesRepository } from '../fines/fines.repository';
import { FinesService } from '../fines/fines.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { PaymentsRepository } from '../payments/payments.repository';
import { PdfService } from '../pdf/pdf.service';
import { TeamsRepository } from '../teams/teams.repository';
import { TournamentsRepository } from '../tournaments/tournaments.repository';
import { UsersRepository } from '../users/users.repository';
import { BalanceService } from '../balance/balance.service';
import { MatchEventsRepository } from './match-events.repository';
import { MatchesRepository } from './matches.repository';

export interface RegisterEventInput {
  matchId: string;
  teamId: string;
  playerId?: string;
  playerOutId?: string;
  eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  minute: number;
}

export interface RegisterEventResult {
  event: object;
  autoFine?: object;
  newScore?: { homeScore: number; awayScore: number };
  autoExpulsion?: {
    event: object;
    fine?: object;
    playerId: string;
    teamId: string;
    minute: number;
  };
}

export interface CancelEventResult {
  cancelledEventId: string;
  fine?: object;
  newScore?: { homeScore: number; awayScore: number };
  cascadedExpulsion?: CancelEventResult;
}

@Injectable()
export class MatchOrchestrationService {
  constructor(
    private matchesRepository: MatchesRepository,
    private matchEventsRepository: MatchEventsRepository,
    private tournamentsRepository: TournamentsRepository,
    private teamsRepository: TeamsRepository,
    private usersRepository: UsersRepository,
    private finesService: FinesService,
    private finesRepository: FinesRepository,
    private pdfService: PdfService,
    private whatsappService: WhatsappService,
    private paymentsRepository: PaymentsRepository,
    private balanceService: BalanceService,
  ) {}

  async registerEvent(input: RegisterEventInput): Promise<RegisterEventResult> {
    const event = await this.matchEventsRepository.create(input);
    const result: RegisterEventResult = { event };

    if (input.eventType === 'GOAL') {
      result.newScore = await this.recalculateScore(input.matchId) ?? undefined;
    }

    if (input.eventType === 'YELLOW_CARD' || input.eventType === 'RED_CARD') {
      result.autoFine = await this.generateAutoFine(input.matchId, input.teamId, event.id, input.eventType) ?? undefined;
    }

    if (input.eventType === 'YELLOW_CARD' && input.playerId) {
      const totalYellows = await this.matchEventsRepository.countYellowsByPlayer(input.matchId, input.playerId);
      if (totalYellows >= 2) {
        const redEvent = await this.matchEventsRepository.create({
          matchId: input.matchId,
          teamId: input.teamId,
          playerId: input.playerId,
          eventType: 'RED_CARD',
          minute: input.minute,
        });
        const expulsionFine = await this.generateAutoFine(input.matchId, input.teamId, redEvent.id, 'RED_CARD') ?? undefined;
        result.autoExpulsion = {
          event: redEvent,
          fine: expulsionFine,
          playerId: input.playerId,
          teamId: input.teamId,
          minute: input.minute,
        };
      }
    }

    return result;
  }

  async cancelEvent(
    eventId: string,
    cancelledById: string,
    reason: string,
    _matchStatus: 'IN_PROGRESS' | 'FINISHED',
  ): Promise<CancelEventResult> {
    // 1. Load the event
    const event = await this.matchEventsRepository.findById(eventId);
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (event.cancelledAt) throw new BadRequestException('El evento ya fue anulado');

    // 2. Load associated fine (if any)
    const fine = await this.finesRepository.findByMatchEventId(eventId);
    if (fine && fine.status === 'PAID' && !fine.cancelledAt) {
      throw new ConflictException('No se puede anular un evento con multa ya pagada');
    }

    // 3. Cancel the main event
    await this.matchEventsRepository.cancelById(eventId, cancelledById, reason);

    // 4. If there is a fine → cancel fine + reverse balance
    if (fine && !fine.cancelledAt) {
      await this.finesRepository.cancelByMatchEventId(eventId);
      await this.balanceService.reverseFineCharge({
        teamId: fine.teamId,
        tournamentId: fine.tournamentId,
        matchId: fine.matchId ?? null,
        fineId: fine.id,
        amount: fine.amount,
      });
    }

    // 5. If YELLOW_CARD → look for a chained RED_CARD from the same player at same minute
    let cascadedExpulsion: CancelEventResult | undefined;
    if (event.eventType === 'YELLOW_CARD' && event.playerId) {
      const linkedRed = await this.matchEventsRepository.findLinkedRed(
        event.matchId,
        event.playerId,
        event.minute,
      );
      if (linkedRed && !linkedRed.cancelledAt) {
        cascadedExpulsion = await this.cancelEvent(
          linkedRed.id,
          cancelledById,
          'Anulación en cascada por amarilla anulada',
          _matchStatus,
        );
      }
    }

    // 6. If GOAL → recalculate score using only active events
    let newScore: { homeScore: number; awayScore: number } | undefined;
    if (event.eventType === 'GOAL') {
      newScore = await this.recalculateScore(event.matchId) ?? undefined;
    }

    return {
      cancelledEventId: eventId,
      fine: fine ?? undefined,
      newScore,
      cascadedExpulsion,
    };
  }

  async closeMatch(matchId: string): Promise<{ closedMatch: object }> {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) throw new NotFoundException('Partido no encontrado');

    const closedMatch = await this.matchesRepository.closeMatch(matchId);

    this.chargeMatchFees(match).catch((err) =>
      console.error('[closeMatch] Error cargando fees al saldo:', err),
    );
    this.sendActaAndNotifications(matchId, match, closedMatch).catch((err) =>
      console.error('[closeMatch] PDF/WhatsApp falló (partido ya cerrado en DB):', err),
    );

    return { closedMatch };
  }

  private async recalculateScore(matchId: string) {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) return null;
    const events = await this.matchEventsRepository.findActiveByMatch(matchId);
    const homeScore = events.filter((e) => e.eventType === 'GOAL' && e.teamId === match.homeTeamId).length;
    const awayScore = events.filter((e) => e.eventType === 'GOAL' && e.teamId === match.awayTeamId).length;
    await this.matchesRepository.updateScore(matchId, homeScore, awayScore);
    return { homeScore, awayScore };
  }

  private async generateAutoFine(
    matchId: string,
    teamId: string,
    matchEventId: string,
    eventType: 'YELLOW_CARD' | 'RED_CARD',
  ) {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) return null;

    const [tournament, team] = await Promise.all([
      this.tournamentsRepository.findById(match.tournamentId),
      this.teamsRepository.findById(teamId),
    ]);
    if (!tournament || !team) return null;

    const amount = eventType === 'YELLOW_CARD' ? tournament.yellowCardFine : tournament.redCardFine;

    let delegatePhone: string | null = null;
    if (team.delegateId) {
      const delegate = await this.usersRepository.findById(team.delegateId);
      delegatePhone = delegate?.whatsappNumber ?? null;
    }

    return this.finesService.createFromEvent({
      teamId,
      tournamentId: match.tournamentId,
      matchId,
      matchEventId,
      eventType,
      amount,
      half: match.currentHalf ?? 1,
      delegatePhone,
      teamName: team.name,
    });
  }

  private async chargeMatchFees(match: Awaited<ReturnType<MatchesRepository['findById']>>) {
    if (!match) return;
    const tournament = await this.tournamentsRepository.findById(match.tournamentId);
    if (!tournament) return;

    const [homeTeam, awayTeam] = await Promise.all([
      this.teamsRepository.findById(match.homeTeamId),
      this.teamsRepository.findById(match.awayTeamId),
    ]);

    await Promise.all([
      this.balanceService.chargeMatchFees({
        teamId: match.homeTeamId,
        tournamentId: match.tournamentId,
        matchId: match.id,
        courtFee: tournament.courtFee,
        refereeFee: tournament.refereeFee,
        refereeFeeEnabled: tournament.refereeFeeEnabled,
        opponentName: awayTeam?.name ?? 'Visitante',
      }),
      this.balanceService.chargeMatchFees({
        teamId: match.awayTeamId,
        tournamentId: match.tournamentId,
        matchId: match.id,
        courtFee: tournament.courtFee,
        refereeFee: tournament.refereeFee,
        refereeFeeEnabled: tournament.refereeFeeEnabled,
        opponentName: homeTeam?.name ?? 'Local',
      }),
    ]);
  }

  private async sendActaAndNotifications(
    matchId: string,
    match: NonNullable<Awaited<ReturnType<MatchesRepository['findById']>>>,
    closedMatch: Awaited<ReturnType<MatchesRepository['closeMatch']>>,
  ) {
    const [tournament, events, homeTeam, awayTeam, payments] = await Promise.all([
      this.tournamentsRepository.findById(match.tournamentId),
      this.matchEventsRepository.findByMatchWithPlayers(matchId),
      this.teamsRepository.findById(match.homeTeamId),
      this.teamsRepository.findById(match.awayTeamId),
      this.paymentsRepository.findByMatch(matchId),
    ]);

    const actaData = {
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
        homeScore: closedMatch.homeScore ?? 0,
        awayScore: closedMatch.awayScore ?? 0,
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
    };

    const pdfBuffer = await this.pdfService.generateActa(actaData);

    if (homeTeam?.delegateId) {
      const delegate = await this.usersRepository.findById(homeTeam.delegateId);
      if (delegate?.whatsappNumber) {
        await this.whatsappService.sendFile(
          delegate.whatsappNumber,
          pdfBuffer,
          `acta-${matchId}.pdf`,
          `Acta del partido: ${homeTeam.name} vs ${awayTeam?.name}`,
        );
      }
    }
  }
}
