import { apiClient } from './client';
import type { Team, Player } from '../types';

export const teamsApi = {
  create: (data: { name: string; tournamentId: string; primaryColor?: string; secondaryColor?: string; logoUrl?: string }) =>
    apiClient.post<Team>('/teams', data).then((r) => r.data),
  update: (id: string, data: { name?: string; primaryColor?: string; secondaryColor?: string; logoUrl?: string | null }) =>
    apiClient.patch<Team>(`/teams/${id}`, data).then((r) => r.data),
  getById: (id: string) => apiClient.get<Team>(`/teams/${id}`).then((r) => r.data),
  getByTournament: (tournamentId: string) =>
    apiClient.get<Team[]>(`/teams/tournament/${tournamentId}`).then((r) => r.data),
};

export const playersApi = {
  create: (data: { name: string; teamId: string; dorsal: number; photoUrl?: string }) =>
    apiClient.post<Player>('/players', data).then((r) => r.data),
  update: (id: string, data: { name?: string; dorsal?: number; photoUrl?: string | null }) =>
    apiClient.patch<Player>(`/players/${id}`, data).then((r) => r.data),
  getByTeam: (teamId: string) =>
    apiClient.get<Player[]>(`/players/team/${teamId}`).then((r) => r.data),
};
