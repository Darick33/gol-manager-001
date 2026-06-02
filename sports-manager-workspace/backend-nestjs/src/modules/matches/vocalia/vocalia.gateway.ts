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
import { MatchEventsRepository } from '../match-events.repository';
import { MatchesRepository } from '../matches.repository';
import { MatchOrchestrationService } from '../match-orchestration.service';
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
    private orchestrationService: MatchOrchestrationService,
  ) {}

  afterInit(server: Server) {
    this.timerService.setServer(server);
  }

  handleConnection(client: Socket) {
    const token = WsJwtGuard.extractTokenFromSocket(client);
    if (!token) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_match')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { matchId: string }) {
    await client.join(`match:${data.matchId}`);
    const [match, events] = await Promise.all([
      this.matchesRepository.findById(data.matchId),
      this.matchEventsRepository.findByMatch(data.matchId),
    ]);
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
    const result = await this.orchestrationService.registerEvent({ ...data, minute });

    this.server.to(`match:${data.matchId}`).emit('event_registered', { event: result.event });
    if (result.newScore) this.server.to(`match:${data.matchId}`).emit('score_updated', result.newScore);
    if (result.autoFine) this.server.to(`match:${data.matchId}`).emit('fine_registered', { fine: result.autoFine });
    if (result.autoExpulsion) {
      this.server.to(`match:${data.matchId}`).emit('event_registered', { event: result.autoExpulsion.event });
      this.server.to(`match:${data.matchId}`).emit('player_expelled', {
        playerId: result.autoExpulsion.playerId,
        teamId: result.autoExpulsion.teamId,
        minute: result.autoExpulsion.minute,
        reason: 'double_yellow',
      });
      if (result.autoExpulsion.fine) {
        this.server.to(`match:${data.matchId}`).emit('fine_registered', { fine: result.autoExpulsion.fine });
      }
    }
    if (result.suspensionWarning) {
      this.server.to(`match:${data.matchId}`).emit('suspension_warning', result.suspensionWarning);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('close_match')
  async handleCloseMatch(@MessageBody() data: { matchId: string }) {
    this.timerService.stop(data.matchId);
    const { closedMatch } = await this.orchestrationService.closeMatch(data.matchId);
    this.server.to(`match:${data.matchId}`).emit('match_closed', { match: closedMatch });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('cancel_event')
  async handleCancelEvent(
    @MessageBody() data: { matchId: string; eventId: string; reason?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.orchestrationService.cancelEvent(
        data.eventId,
        (client.data as { user: { id: string } }).user.id,
        data.reason ?? 'Corrección vocal',
        'IN_PROGRESS',
      );
      this.server.to(`match:${data.matchId}`).emit('event_cancelled', {
        eventId: result.cancelledEventId,
        cascadedEventId: result.cascadedExpulsion?.cancelledEventId,
        newScore: result.newScore,
      });
    } catch (err) {
      client.emit('cancel_event_error', { message: (err as Error).message });
    }
  }
}
