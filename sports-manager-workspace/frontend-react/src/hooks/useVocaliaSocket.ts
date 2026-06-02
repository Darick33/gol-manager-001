import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Match, MatchEvent, Team, Player, Tournament, Fine } from '../types';
import { teamsApi, playersApi } from '../api/teams.api';
import { tournamentsApi } from '../api/tournaments.api';
import { finesApi } from '../api/fines.api';

export interface VocaliaTimer {
  seconds: number;
  currentHalf: number;
  running: boolean;
}

export interface VocaliaExpulsion {
  playerId: string;
  teamId: string;
  minute: number;
}

export interface VocaliaSocketState {
  connected: boolean;
  match: Match | null;
  events: MatchEvent[];
  fines: Fine[];
  timer: VocaliaTimer;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homePlayers: Player[];
  awayPlayers: Player[];
  tournament: Tournament | null;
  halfEnded: boolean;
  matchClosed: boolean;
  expulsionAlert: VocaliaExpulsion | null;
  homeColor: string;
  awayColor: string;
  setHomeColor: (c: string) => void;
  setAwayColor: (c: string) => void;
  socketRef: React.MutableRefObject<Socket | null>;
  fetchFines: () => Promise<void>;
}

export function useVocaliaSocket(matchId: string | undefined, token: string | null): VocaliaSocketState {
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [timer, setTimer] = useState<VocaliaTimer>({ seconds: 0, currentHalf: 1, running: false });
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [halfEnded, setHalfEnded] = useState(false);
  const [matchClosed, setMatchClosed] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [homeColor, setHomeColor] = useState('#3b82f6');
  const [awayColor, setAwayColor] = useState('#ef4444');
  const [expulsionAlert, setExpulsionAlert] = useState<VocaliaExpulsion | null>(null);

  const fetchFines = useCallback(async () => {
    if (!matchId) return;
    try {
      const data = await finesApi.listByMatch(matchId);
      setFines(data);
    } catch { /* silently fail */ }
  }, [matchId]);

  const fetchTeams = useCallback(async (m: Match) => {
    try {
      const [ht, at] = await Promise.all([
        teamsApi.getById(m.homeTeamId),
        teamsApi.getById(m.awayTeamId),
      ]);
      setHomeTeam(ht);
      setAwayTeam(at);
      if (m.homeTeamColor) setHomeColor(m.homeTeamColor);
      if (m.awayTeamColor) setAwayColor(m.awayTeamColor);

      const [hp, ap] = await Promise.all([
        playersApi.getByTeam(m.homeTeamId),
        playersApi.getByTeam(m.awayTeamId),
      ]);
      setHomePlayers(hp);
      setAwayPlayers(ap);
    } catch (e: unknown) {
      const err = e as { response?: { status: number; data: unknown }; message?: string };
      console.error('[vocalia] fetchTeams error:', err?.response?.status, err?.response?.data ?? err?.message);
    }

    try {
      const trn = await tournamentsApi.getById(m.tournamentId);
      setTournament(trn);
    } catch {
      // tournament is non-critical — teams still display
    }
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const socket = io('/vocalia', { transports: ['websocket'], auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_match', { matchId });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('match_state', ({ match: m, events: evs }: { match: Match; events: MatchEvent[] }) => {
      setMatch(m);
      setEvents(evs);
      const running = m.timerRunning ?? false;
      const half = m.currentHalf ?? 1;
      setTimer({ seconds: m.timerSeconds ?? 0, currentHalf: half, running });
      if (m.status === 'FINISHED') setMatchClosed(true);
      if (m.status === 'IN_PROGRESS' && !running && half === 1) setHalfEnded(true);
      fetchTeams(m);
      fetchFines();
    });

    socket.on('timer_tick', (data: VocaliaTimer) => setTimer(data));
    socket.on('half_ended', () => {
      setHalfEnded(true);
      setTimer((t) => ({ ...t, running: false }));
    });
    socket.on('match_started', () => {
      setMatch((m) => (m ? { ...m, status: 'IN_PROGRESS' } : m));
      setHalfEnded(false);
    });
    socket.on('second_half_started', () => {
      setHalfEnded(false);
      setTimer((t) => ({ ...t, seconds: 0, currentHalf: 2, running: true }));
    });
    socket.on('score_updated', ({ homeScore, awayScore }: { homeScore: number; awayScore: number }) => {
      setMatch((m) => (m ? { ...m, homeScore, awayScore } : m));
    });
    socket.on('event_registered', ({ event }: { event: MatchEvent }) =>
      setEvents((prev) => [...prev, event]),
    );
    socket.on('fine_registered', ({ fine }: { fine: Fine }) =>
      setFines((prev) => [...prev, fine]),
    );
    socket.on('colors_updated', ({ homeTeamColor, awayTeamColor }: { homeTeamColor: string; awayTeamColor: string }) => {
      setHomeColor(homeTeamColor);
      setAwayColor(awayTeamColor);
    });
    socket.on('match_closed', ({ match: m }: { match: Match }) => {
      setMatch(m);
      setMatchClosed(true);
    });
    socket.on('player_expelled', ({ playerId, teamId, minute }: VocaliaExpulsion) => {
      setExpulsionAlert({ playerId, teamId, minute });
      setTimeout(() => setExpulsionAlert(null), 6000);
    });

    return () => socket.disconnect();
  }, [matchId, token, fetchTeams, fetchFines]);

  return {
    connected,
    match,
    events,
    fines,
    timer,
    homeTeam,
    awayTeam,
    homePlayers,
    awayPlayers,
    tournament,
    halfEnded,
    matchClosed,
    expulsionAlert,
    homeColor,
    awayColor,
    setHomeColor,
    setAwayColor,
    socketRef,
    fetchFines,
  };
}
