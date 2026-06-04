import { apiClient } from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
};

export async function exchangeHandshake(token: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/handshake', { token });
  return response.data;
}
