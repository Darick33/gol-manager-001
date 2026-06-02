import { apiClient } from './client';
import type { League } from '../types';

interface CreateLeagueDto {
  name: string;
  slug: string;
  subdomain?: string;
  logoUrl?: string | null;
}

export const leaguesApi = {
  list: () => apiClient.get<League[]>('/leagues').then((r) => r.data),
  create: (data: CreateLeagueDto) =>
    apiClient.post<League>('/leagues', data).then((r) => r.data),
};
