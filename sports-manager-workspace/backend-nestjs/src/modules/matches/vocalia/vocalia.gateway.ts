import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { BalanceService } from '../../balance/balance.service';
import { FinesService } from '../../fines/fines.service';
import { WhatsappService } from '../../notifications/whatsapp.service';
import { PaymentsRepository } from '../../payments/payments.repository';
import { PdfService } from '../../pdf/pdf.service';
import { TeamsRepository } from '../../teams/teams.repository';
import { TournamentsRepository } from '../../tournaments/tournaments.repository';
import { UsersRepository } from '../../users/users.repository';
import { MatchEventsRepository } from '../match-events.repository';
import { MatchesRepository } from '../matches.repository';
import { MatchTimerService } from './match-timer.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  namespace: 'vocalia',
})
export class VocaliaGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private timerService: MatchTimerService,
    private matchesRepository: MatchesRepository,
    private matchEventsRepository: MatchEventsRepository,
    private tournamentsRepository: TournamentsRepository,
    private teamsRepository: TeamsRepository,
    private usersRepository: UsersRepository,
    private finesService: FinesService,
    private pdfService: PdfService,
    private whatsappService: WhatsappService,
    private paymentsRepository: PaymentsRepository,
    private balanceService: BalanceService,
  ) {}

  afterInit(server: Server) {
    this.timerService.setServer(server);
  }

  handleConnection(client: Socket) {
    const token = WsJwtGuard.extractTokenFromSocket(client);
    if (!token) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }
    // Full JWT verification happens in WsJwtGuard on each protected message.
    // Connection-level check ensures unauthenticated clients are dropped immediately.
  }

  @SubscribeMessage('join_match')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { matchId: string }) {
    await client.join(`match:${data.matchId}`);
    const match = await this.matchesRepository.findById(data.matchId);
    const events = await this.matchEventsRepository.findByMatch(data.matchId);
    client.emit('match_state', { match, events });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('set_colors')
  async handleSetColors(
    @MessageBody() data: { matchId: string; homeColor: string; awayColor: string },
  ) {
    const match = await this.matchesRepository.updateColors(data.matchId, data.homeColor, data.awayColor);
    this.server.to(`match:${data.matchId}`).emit('colors_updated', {
      homeTeamColor: match.homeTeamColor,
      awayTeamColor: match.awayTeamColor,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('start_match')
  async handleStartMatch(@MessageBody() data: { matchId: string; halfDurationMinutes: number }) {
    await this.matchesRepository.updateStatus(data.matchId, 'IN_PROGRESS');
    this.timerService.start(data.matchId, data.halfDurationMinutes, 1, 0);
    this.server.to(`match:${data.matchId}`).emit('match_started', { matchId: data.matchId });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('start_second_half')
  async handleSecondHalf(@MessageBody() data: { matchId: string; halfDurationMinutes: number }) {
    this.timerService.resume(data.matchId, data.halfDurationMinutes, 2);
    this.server.to(`match:${data.matchId}`).emit('second_half_started', { matchId: data.matchId });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('register_event')
  async handleRegisterEvent(
    @MessageBody() data: {
      matchId: string;
      teamId: string;
      playerId?: string;
      playerOutId?: string;
      eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
    },
  ) {
    const minute = Math.floor(this.timerService.getCurrentSeconds(data.matchId) / 60);
    const event = await this.matchEventsRepository.create({ ...data, minute });
    this.server.to(`match:${data.matchId}`).emit('event_registered', { event });

    if (data.eventType === 'GOAL') {
      await this.recalculateAndEmitScore(data.matchId);
    }

    if (data.eventType === 'YELLOW_CARD' || data.eventType === 'RED_CARD') {
      const fine = await this.generateAutoFine(data.matchId, data.teamId, event.id, data.eventType);
      if (fine) this.server.to(`match:${data.matchId}`).emit('fine_registered', { fine });
    }

    // 2 amarillas al mismo jugador = expulsión automática
    if (data.eventType === 'YELLOW_CARD' && data.playerId) {
      const totalYellows = await this.matchEventsRepository.countYellowsByPlayer(
        data.matchId,
        data.playerId,
      );
      if (totalYellows >= 2) {
        const redEvent = await this.matchEventsRepository.create({
          matchId: data.matchId,
          teamId: data.teamId,
          playerId: data.playerId,
          eventType: 'RED_CARD',
          minute,
        });
        this.server.to(`match:${data.matchId}`).emit('event_registered', { event: redEvent });
        this.server.to(`match:${data.matchId}`).emit('player_expelled', {
          playerId: data.playerId,
          teamId: data.teamId,
          minute,
          reason: 'double_yellow',
        });
        const redFine = await this.generateAutoFine(data.matchId, data.teamId, redEvent.id, 'RED_CARD');
        if (redFine) this.server.to(`match:${data.matchId}`).emit('fine_registered', { fine: redFine });
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('close_match')
  async handleCloseMatch(@MessageBody() data: { matchId: string }) {
    this.timerService.stop(data.matchId);

    const match = await this.matchesRepository.findById(data.matchId);
    if (!match) return;

    // 1. Cerrar partido en DB primero — siempre debe ejecutarse
    const closedMatch = await this.matchesRepository.closeMatch(data.matchId);

    // 2. Notificar a todos los clientes inmediatamente
    this.server.to(`match:${data.matchId}`).emit('match_closed', { match: closedMatch });

    // 3. Cobros de cancha + árbitro en best-effort
    try {
      const tournamentForFees = await this.tournamentsRepository.findById(match.tournamentId);
      if (tournamentForFees) {
        const [homeTeamForFees, awayTeamForFees] = await Promise.all([
          this.teamsRepository.findById(match.homeTeamId),
          this.teamsRepository.findById(match.awayTeamId),
        ]);
        await Promise.all([
          this.balanceService.chargeMatchFees({
            teamId: match.homeTeamId,
            tournamentId: match.tournamentId,
            matchId: data.matchId,
            courtFee: tournamentForFees.courtFee,
            refereeFee: tournamentForFees.refereeFee,
            refereeFeeEnabled: tournamentForFees.refereeFeeEnabled,
            opponentName: awayTeamForFees?.name ?? 'Visitante',
          }),
          this.balanceService.chargeMatchFees({
            teamId: match.awayTeamId,
            tournamentId: match.tournamentId,
            matchId: data.matchId,
            courtFee: tournamentForFees.courtFee,
            refereeFee: tournamentForFees.refereeFee,
            refereeFeeEnabled: tournamentForFees.refereeFeeEnabled,
            opponentName: homeTeamForFees?.name ?? 'Local',
          }),
        ]);
      }
    } catch (err) {
      console.error('[close_match] Error cargando fees al saldo:', err);
    }

    // 4. PDF + WhatsApp en best-effort: si falla, el partido ya está cerrado
    try {
      const [tournament, events, homeTeam, awayTeam, payments] = await Promise.all([
        this.tournamentsRepository.findById(match.tournamentId),
        this.matchEventsRepository.findByMatchWithPlayers(data.matchId),
        this.teamsRepository.findById(match.homeTeamId),
        this.teamsRepository.findById(match.awayTeamId),
        this.paymentsRepository.findByMatch(data.matchId),
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
            `acta-${data.matchId}.pdf`,
            `⚽ Acta del partido: ${homeTeam.name} vs ${awayTeam?.name}`,
          );
        }
      }
    } catch (err) {
      console.error('[close_match] PDF/WhatsApp falló (partido ya cerrado en DB):', err);
    }
  }

  private async recalculateAndEmitScore(matchId: string) {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) return;
    const events = await this.matchEventsRepository.findByMatch(matchId);
    const homeScore = events.filter((e) => e.eventType === 'GOAL' && e.teamId === match.homeTeamId).length;
    const awayScore = events.filter((e) => e.eventType === 'GOAL' && e.teamId === match.awayTeamId).length;
    await this.matchesRepository.updateScore(matchId, homeScore, awayScore);
    this.server.to(`match:${matchId}`).emit('score_updated', { homeScore, awayScore });
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
}
