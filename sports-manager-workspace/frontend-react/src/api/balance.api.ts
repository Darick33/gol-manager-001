import { apiClient } from './client';
import type { TeamBalance, TeamBalanceSummary } from '../types';

export const balanceApi = {
  getByTournament: (tournamentId: string) =>
    apiClient.get<TeamBalance[]>(`/balances/tournament/${tournamentId}`).then((r) => r.data),

  getTeamSummary: (teamId: string, tournamentId: string) =>
    apiClient.get<TeamBalanceSummary>(`/balances/team/${teamId}/tournament/${tournamentId}`).then((r) => r.data),
};
