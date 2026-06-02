import { Injectable } from '@nestjs/common';
import { MatchEventsRepository } from './match-events.repository';
import { MatchesRepository } from './matches.repository';
import { SuspensionsRepository } from './suspensions.repository';
import { TournamentsRepository } from '../tournaments/tournaments.repository';

@Injectable()
export class SuspensionsService {
  constructor(
    private suspensionsRepository: SuspensionsRepository,
    private matchEventsRepository: MatchEventsRepository,
    private tournamentsRepository: TournamentsRepository,
    private matchesRepository: MatchesRepository,
  ) {}

  /**
   * Called after a match is closed. Generates PENDING suspension records
   * for players who accumulated yellows or received a direct red in this match.
   */
  async generateForMatch(matchId: string): Promise<void> {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) return;

    const tournament = await this.tournamentsRepository.findById(match.tournamentId);
    if (!tournament) return;

    const yellows_for_suspension = tournament.yellows_for_suspension ?? 2;
    const redCardSuspensionMatches = tournament.redCardSuspensionMatches ?? 1;

    const events = await this.matchEventsRepository.findActiveByMatch(matchId);
    const cardEvents = events.filter(
      (e) => e.eventType === 'YELLOW_CARD' || e.eventType === 'RED_CARD',
    );

    const processedPlayers = new Set<string>();

    for (const event of cardEvents) {
      if (!event.playerId || processedPlayers.has(event.playerId)) continue;
      processedPlayers.add(event.playerId);

      if (event.eventType === 'RED_CARD') {
        await this.suspensionsRepository.create({
          playerId: event.playerId,
          tournamentId: match.tournamentId,
          triggeredByMatchId: matchId,
          triggeredByEventId: event.id,
          reason: 'RED_CARD_DIRECT',
          matchesSuspended: redCardSuspensionMatches,
        });
      } else if (event.eventType === 'YELLOW_CARD') {
        const totalYellows = await this.matchEventsRepository.countYellowsByPlayerInTournament(
          event.playerId,
          match.tournamentId,
        );
        if (yellows_for_suspension > 0 && totalYellows % yellows_for_suspension === 0) {
          await this.suspensionsRepository.create({
            playerId: event.playerId,
            tournamentId: match.tournamentId,
            triggeredByMatchId: matchId,
            triggeredByEventId: event.id,
            reason: 'YELLOW_ACCUMULATION',
            matchesSuspended: 1,
          });
        }
      }
    }
  }

  /**
   * Called at the start of registerEvent. If the player has a PENDING suspension,
   * consume (mark SERVED) it so they serve the suspension in the next match they play.
   */
  async consumeIfPending(playerId: string, tournamentId: string): Promise<void> {
    const pending = await this.suspensionsRepository.findPendingByPlayerAndTournament(
      playerId,
      tournamentId,
    );
    if (pending) {
      await this.suspensionsRepository.markAsServed(pending.id);
    }
  }

  /**
   * Returns true if the player has a PENDING suspension for the given tournament.
   */
  async isSuspended(playerId: string, tournamentId: string): Promise<boolean> {
    const pending = await this.suspensionsRepository.findPendingByPlayerAndTournament(
      playerId,
      tournamentId,
    );
    return !!pending;
  }

  /**
   * Returns true if the player is at yellows_for_suspension - 1 yellows (one away from suspension).
   */
  async isNearSuspension(
    playerId: string,
    tournamentId: string,
    threshold: number,
  ): Promise<boolean> {
    if (threshold <= 1) return false;
    const count = await this.matchEventsRepository.countYellowsByPlayerInTournament(
      playerId,
      tournamentId,
    );
    return count > 0 && count % threshold === threshold - 1;
  }

  async findPendingByTournament(tournamentId: string) {
    return this.suspensionsRepository.findPendingByTournament(tournamentId);
  }

  async cancel(suspensionId: string) {
    return this.suspensionsRepository.cancel(suspensionId);
  }
}
