import { apiClient } from './client';
import type { Tournament, Match } from '../types';

export const tournamentsApi = {
  list: () => apiClient.get<Tournament[]>('/tournaments').then((r) => r.data),
  getById: (id: string) => apiClient.get<Tournament>(`/tournaments/id/${id}`).then((r) => r.data),
  create: (data: Omit<Tournament, 'id' | 'slug' | 'status' | 'createdAt' | 'category'>) =>
    apiClient.post<Tournament>('/tournaments', data).then((r) => r.data),
  update: (id: string, data: Partial<Tournament>) =>
    apiClient.patch<Tournament>(`/tournaments/${id}`, data).then((r) => r.data),
  generateFixture: (id: string) =>
    apiClient.post<{ matchesCreated: number; matches: Match[] }>(`/tournaments/${id}/fixture`).then((r) => r.data),
  getMatches: (id: string) =>
    apiClient.get<Match[]>(`/matches/tournament/${id}`).then((r) => r.data),
};
