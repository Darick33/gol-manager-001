import { apiClient } from './client';
import type { TournamentRound } from '../types';

export const roundsApi = {
  listByTournament: (tournamentId: string) =>
    apiClient.get<TournamentRound[]>(`/rounds/tournament/${tournamentId}`).then((r) => r.data),

  closeRound: (tournamentId: string, stage: number) =>
    apiClient.patch<TournamentRound>(`/rounds/tournament/${tournamentId}/stage/${stage}/close`).then((r) => r.data),
};
