import { apiClient } from './client';
import type { Fine, Payment, PaymentMethod } from '../types';

export const finesApi = {
  listByTournament: (tournamentId: string) =>
    apiClient.get<Fine[]>(`/fines/tournament/${tournamentId}`).then((r) => r.data),
  listByTeam: (teamId: string) =>
    apiClient.get<Fine[]>(`/fines/team/${teamId}`).then((r) => r.data),
  listByMatch: (matchId: string) =>
    apiClient.get<Fine[]>(`/fines/match/${matchId}`).then((r) => r.data),
  create: (dto: { teamId: string; tournamentId: string; matchId?: string; amount: number; reason: string; half?: number }) =>
    apiClient.post<Fine>('/fines', dto).then((r) => r.data),
};

export const paymentsApi = {
  listPending: () => apiClient.get<Payment[]>('/payments/pending').then((r) => r.data),
  listByTeam: (teamId: string) =>
    apiClient.get<Payment[]>(`/payments/team/${teamId}`).then((r) => r.data),
  listByMatch: (matchId: string) =>
    apiClient.get<Payment[]>(`/payments/match/${matchId}`).then((r) => r.data),
  registerMatchPayment: (dto: { matchId: string; teamId: string; method: PaymentMethod; amount: number; receiptUrl?: string }) =>
    apiClient.post<Payment>('/payments/match', dto).then((r) => r.data),
  approve: (id: string, adminId: string) =>
    apiClient.patch<Payment>(`/payments/${id}/approve`, { adminId }).then((r) => r.data),
  reject: (id: string, adminId: string) =>
    apiClient.patch<Payment>(`/payments/${id}/reject`, { adminId }).then((r) => r.data),
  uploadReceipt: (fineId: string, teamId: string, receiptUrl: string) =>
    apiClient.post<Payment>(`/payments/fine/${fineId}/team/${teamId}`, { receiptUrl }).then((r) => r.data),
};
