import { apiClient } from './client';
import type { User } from '../types';

export function getLeagueUsers(): Promise<User[]> {
  return apiClient.get<User[]>('/users').then((r) => r.data);
}

export function createVocal(dto: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  return apiClient.post<User>('/users/vocal', dto).then((r) => r.data);
}

export function createDelegate(dto: {
  name: string;
  email: string;
  password: string;
  whatsappNumber?: string;
}): Promise<User> {
  return apiClient.post<User>('/users/delegate', dto).then((r) => r.data);
}

export function updateUserStatus(id: string, active: boolean): Promise<User> {
  return apiClient.patch<User>(`/users/${id}/status`, { active }).then((r) => r.data);
}
