import { apiClient } from './client';
import type { League } from '../types';

export function getAllLeagues(): Promise<League[]> {
  return apiClient.get<League[]>('/leagues').then((r) => r.data);
}

export function updateLeagueStatus(
  id: string,
  status: 'ACTIVE' | 'SUSPENDED',
): Promise<League> {
  return apiClient.patch<League>(`/leagues/${id}/status`, { status }).then((r) => r.data);
}

export function enterLeague(leagueId: string): Promise<{ handshake_token: string }> {
  return apiClient
    .post<{ handshake_token: string }>(`/platform/enter-league/${leagueId}`)
    .then((r) => r.data);
}
