export type UserRole = 'PLATFORM_ADMIN' | 'SUPER_ADMIN' | 'VOCAL' | 'DELEGATE';
export type SportType = 'FOOTBALL' | 'FUTSAL';
export type TournamentFormat = 'ROUND_ROBIN' | 'DIRECT_ELIMINATION' | 'GROUPS_ELIMINATION';
export type TournamentStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED';
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
export type EventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'FOUL';
export type FineStatus = 'PENDING' | 'PAID';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMethod = 'CASH' | 'TRANSFER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  leagueId: string | null;
  whatsappNumber: string | null;
  createdAt: string;
}

export interface League {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  logoUrl: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
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
  refereeFeeEnabled: boolean;
  halfDurationMinutes: number;
  maxRosterSize: number;
  category: string | null;
  logoUrl: string | null;
  logoBgRemovedUrl: string | null;
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
  fineId: string | null;
  matchId: string | null;
  teamId: string;
  method: PaymentMethod;
  amount: number;
  receiptUrl: string | null;
  status: PaymentStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export type BalanceLedgerType = 'MATCH_CHARGE' | 'FINE_CHARGE' | 'PAYMENT_CREDIT' | 'ADJUSTMENT';

export interface TeamBalance {
  id: string;
  teamId: string;
  tournamentId: string;
  balance: number;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  teamId: string;
  tournamentId: string;
  matchId: string | null;
  fineId: string | null;
  paymentId: string | null;
  type: BalanceLedgerType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface TeamBalanceSummary {
  balance: number;
  ledger: LedgerEntry[];
}

export type RoundStatus = 'OPEN' | 'CLOSED';

export interface TournamentRound {
  id: string;
  tournamentId: string;
  stage: number;
  name: string | null;
  status: RoundStatus;
  closedAt: string | null;
  closedById: string | null;
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
