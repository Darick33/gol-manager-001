import { apiClient } from './client';
import type { Match, MatchEvent } from '../types';

export const matchesApi = {
  getById: (id: string) =>
    apiClient.get<{ match: Match; events: MatchEvent[] }>(`/matches/${id}`).then((r) => r.data),
  updateSchedule: (id: string, scheduledAt: string | null) =>
    apiClient.patch<Match>(`/matches/${id}/schedule`, { scheduledAt }).then((r) => r.data),
  getActa: (id: string) =>
    apiClient.get(`/matches/${id}/acta`, { responseType: 'blob' }).then((r) => r.data as Blob),
  cancelEvent: (matchId: string, eventId: string, reason: string) =>
    apiClient.delete(`/matches/${matchId}/events/${eventId}`, { data: { reason } }).then((r) => r.data),
};
