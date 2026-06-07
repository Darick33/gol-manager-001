import { apiClient } from './client';
import type { Tournament } from '../types';

export interface PublicTeam {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface PublicMatch {
  id: string;
  tournamentId?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
  scheduledAt: string | null;
  stage: number | null;
  phase: string | null;
  homeScore: number;
  awayScore: number;
  timerSeconds: number;
  timerRunning: boolean;
  currentHalf: number;
  actaPdfUrl?: string | null;
  homeTeam: PublicTeam;
  awayTeam: PublicTeam;
}

export interface StandingRow {
  team: PublicTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface PublicTournament extends Tournament {
  teams: (PublicTeam & { secondaryColor: string | null })[];
}

export interface ScorerRow {
  player: { id: string; name: string; dorsal: number; photoUrl: string | null };
  team: PublicTeam;
  goals: number;
}

export interface PublicLeagueInfo {
  name: string;
  logoUrl: string | null;
  slug: string;
}

export const publicApi = {
  getLeagueInfo: () =>
    apiClient.get<PublicLeagueInfo>('/public/league').then((r) => r.data),

  getLiveMatches: () =>
    apiClient.get<PublicMatch[]>('/public/live').then((r) => r.data),

  getTournaments: () =>
    apiClient.get<Tournament[]>('/public/tournaments').then((r) => r.data),

  getTournament: (slug: string) =>
    apiClient.get<PublicTournament>(`/public/tournaments/${slug}`).then((r) => r.data),

  getMatches: (slug: string) =>
    apiClient.get<PublicMatch[]>(`/public/tournaments/${slug}/matches`).then((r) => r.data),

  getStandings: (slug: string) =>
    apiClient.get<StandingRow[]>(`/public/tournaments/${slug}/standings`).then((r) => r.data),

  getScorers: (slug: string) =>
    apiClient.get<ScorerRow[]>(`/public/tournaments/${slug}/scorers`).then((r) => r.data),

  getScorersByTournamentId: (id: string) =>
    apiClient.get<ScorerRow[]>(`/public/by-id/${id}/scorers`).then((r) => r.data),
};
