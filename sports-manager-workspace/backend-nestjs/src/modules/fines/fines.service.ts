import { Injectable, NotFoundException } from '@nestjs/common';
import { WhatsappService } from '../notifications/whatsapp.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { FinesRepository } from './fines.repository';

export interface AutoFinePayload {
  teamId: string;
  tournamentId: string;
  matchId: string;
  matchEventId: string;
  eventType: 'YELLOW_CARD' | 'RED_CARD';
  amount: number;
  half: number;
  delegatePhone?: string | null;
  teamName: string;
}

@Injectable()
export class FinesService {
  constructor(
    private finesRepository: FinesRepository,
    private whatsappService: WhatsappService,
  ) {}

  async create(dto: CreateFineDto) {
    return this.finesRepository.create(dto);
  }

  async createFromEvent(payload: AutoFinePayload) {
    const reason =
      payload.eventType === 'YELLOW_CARD'
        ? 'Tarjeta Amarilla'
        : 'Tarjeta Roja';

    const fine = await this.finesRepository.create({
      teamId: payload.teamId,
      tournamentId: payload.tournamentId,
      matchId: payload.matchId,
      matchEventId: payload.matchEventId,
      amount: payload.amount,
      half: payload.half,
      reason,
    });

    if (payload.delegatePhone) {
      await this.whatsappService.sendText(
        payload.delegatePhone,
        `🟡 *Multa generada — ${payload.teamName}*\n` +
        `Motivo: ${reason}\n` +
        `Monto: $${payload.amount.toLocaleString('es-CO')}\n` +
        `Estado: PENDIENTE`,
      );
    }

    return fine;
  }

  findByMatch(matchId: string) {
    return this.finesRepository.findByMatch(matchId);
  }

  findByTeam(teamId: string) {
    return this.finesRepository.findByTeam(teamId);
  }

  findByTournament(tournamentId: string) {
    return this.finesRepository.findByTournament(tournamentId);
  }

  async findById(id: string) {
    const fine = await this.finesRepository.findById(id);
    if (!fine) throw new NotFoundException('Multa no encontrada');
    return fine;
  }
}
