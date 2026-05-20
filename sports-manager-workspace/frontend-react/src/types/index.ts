export type UserRole = 'SUPER_ADMIN' | 'VOCAL' | 'DELEGATE';
export type SportType = 'FOOTBALL' | 'FUTSAL';
export type TournamentFormat = 'ROUND_ROBIN' | 'DIRECT_ELIMINATION' | 'GROUPS_ELIMINATION';
export type TournamentStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED';
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
export type EventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'FOUL';
export type FineStatus = 'PENDING' | 'PAID';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  whatsappNumber: string | null;
  createdAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  sportType: SportType;
  format: TournamentFormat;
  status: TournamentStatus;
  yellowCardFine: number;
  redCardFine: number;
  lateFine: number;
  courtFee: number;
  refereeFee: number;
  halfDurationMinutes: number;
  maxRosterSize: number;
  category: string | null;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  tournamentId: string;
  delegateId: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  dorsal: number;
  photoUrl: string | null;
  createdAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  vocalId: string | null;
  phase: string | null;
  stage: number | null;
  scheduledAt: string | null;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  homeTeamColor: string | null;
  awayTeamColor: string | null;
  timerSeconds: number;
  timerRunning: boolean;
  currentHalf: number;
  actaPdfUrl: string | null;
  createdAt: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string | null;
  playerOutId: string | null;
  eventType: EventType;
  minute: number;
  createdAt: string;
}

export interface Fine {
  id: string;
  teamId: string;
  tournamentId: string;
  matchId: string | null;
  matchEventId: string | null;
  reason: string;
  amount: number;
  half: number;
  status: FineStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  fineId: string;
  teamId: string;
  receiptUrl: string;
  status: PaymentStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
