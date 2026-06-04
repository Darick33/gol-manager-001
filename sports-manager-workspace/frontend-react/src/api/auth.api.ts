import { apiClient } from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
};

export function exchangeHandshake(token: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/handshake', { token }).then((r) => r.data);
}
