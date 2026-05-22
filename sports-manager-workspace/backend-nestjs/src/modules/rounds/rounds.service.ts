import { Injectable } from '@nestjs/common';
import { RoundsRepository } from './rounds.repository';

@Injectable()
export class RoundsService {
  constructor(private readonly roundsRepository: RoundsRepository) {}

  getTournamentRounds(tournamentId: string) {
    return this.roundsRepository.findByTournament(tournamentId);
  }

  closeRound(tournamentId: string, stage: number, closedById: string) {
    return this.roundsRepository.closeRound(tournamentId, stage, closedById);
  }

  isRoundClosed(tournamentId: string, stage: number) {
    return this.roundsRepository.isRoundClosed(tournamentId, stage);
  }
}
