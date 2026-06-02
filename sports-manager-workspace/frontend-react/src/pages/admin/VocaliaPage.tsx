import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  Swords,
  AlertCircle,
  Settings,
} from 'lucide-react';
import type { Match, MatchEvent, Team, Player, EventType, Tournament, Fine } from '../../types';
import { apiClient } from '../../api/client';
import { finesApi } from '../../api/fines.api';
import { useAuthStore } from '../../store/auth.store';
import { PaymentModal } from '../../components/ui/PaymentModal';

type MobileTab = 'match' | 'fines' | 'controls';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmt(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}

function EventDot({ type }: { type: EventType }) {
  if (type === 'GOAL') return (
    <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" style={{ boxShadow: '0 0 5px rgba(74,222,128,0.6)' }} />
  );
  if (type === 'YELLOW_CARD') return (
    <div className="w-2 h-3 rounded-sm bg-yellow-400 shrink-0" style={{ boxShadow: '0 0 4px rgba(234,179,8,0.6)' }} />
  );
  if (type === 'RED_CARD') return (
    <div className="w-2 h-3 rounded-sm bg-red-500 shrink-0" style={{ boxShadow: '0 0 4px rgba(239,68,68,0.6)' }} />
  );
  if (type === 'FOUL') return (
    <div className="w-3 h-0.5 rounded-full bg-orange-400 shrink-0" style={{ boxShadow: '0 0 3px rgba(251,146,60,0.5)' }} />
  );
  return null;
}

export default function VocaliaPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [timer, setTimer] = useState({ seconds: 0, currentHalf: 1, running: false });
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [homeLogoError, setHomeLogoError] = useState(false);
  const [awayLogoError, setAwayLogoError] = useState(false);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [halfDuration, setHalfDuration] = useState(20);
  const [halfEnded, setHalfEnded] = useState(false);
  const [matchClosed, setMatchClosed] = useState(false);
  const [homeColor, setHomeColor] = useState('#3b82f6');
  const [awayColor, setAwayColor] = useState('#ef4444');
  const [showColors, setShowColors] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('match');
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const [eventModal, setEventModal] = useState<{ type: EventType; teamId: string } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedPlayerOutId, setSelectedPlayerOutId] = useState('');
  const [expulsionAlert, setExpulsionAlert] = useState<{ playerId: string; teamId: string; minute: number } | null>(null);

  const [fineModal, setFineModal] = useState(false);
  const [fineTeamId, setFineTeamId] = useState('');
  const [fineReason, setFineReason] = useState('Llegada tarde');
  const [fineAmount, setFineAmount] = useState(0);
  const [fineSaving, setFineSaving] = useState(false);
  const [fineSuccess, setFineSuccess] = useState(false);

  const [paymentTeamId, setPaymentTeamId] = useState<string | null>(null);

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
        apiClient.get<Team>(`/teams/${m.homeTeamId}`).then((r) => r.data),
        apiClient.get<Team>(`/teams/${m.awayTeamId}`).then((r) => r.data),
      ]);
      setHomeTeam(ht); setAwayTeam(at);
      if (m.homeTeamColor) setHomeColor(m.homeTeamColor);
      if (m.awayTeamColor) setAwayColor(m.awayTeamColor);
      const [hp, ap] = await Promise.all([
        apiClient.get<Player[]>(`/players/team/${m.homeTeamId}`).then((r) => r.data),
        apiClient.get<Player[]>(`/players/team/${m.awayTeamId}`).then((r) => r.data),
      ]);
      setHomePlayers(hp); setAwayPlayers(ap);
    } catch (e: unknown) {
      const err = e as { response?: { status: number; data: unknown }; message?: string };
      console.error('[vocalia] fetchTeams error:', err?.response?.status, err?.response?.data ?? err?.message);
    }

    try {
      const trn = await apiClient.get<Tournament>(`/tournaments/id/${m.tournamentId}`).then((r) => r.data);
      setTournament(trn);
    } catch {
      // tournament is non-critical — teams still display
    }
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const socket = io('/vocalia', { transports: ['websocket'], auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => { setConnected(true); socket.emit('join_match', { matchId }); });
    socket.on('disconnect', () => setConnected(false));

    socket.on('match_state', ({ match: m, events: evs }: { match: Match; events: MatchEvent[] }) => {
      setMatch(m); setEvents(evs);
      const running = m.timerRunning ?? false;
      const half = m.currentHalf ?? 1;
      setTimer({ seconds: m.timerSeconds ?? 0, currentHalf: half, running });
      if (m.status === 'FINISHED') setMatchClosed(true);
      if (m.status === 'IN_PROGRESS' && !running && half === 1) setHalfEnded(true);
      fetchTeams(m); fetchFines();
    });
    socket.on('timer_tick', (data: { seconds: number; currentHalf: number; running: boolean }) => setTimer(data));
    socket.on('half_ended', () => { setHalfEnded(true); setTimer((t) => ({ ...t, running: false })); });
    socket.on('match_started', () => { setMatch((m) => (m ? { ...m, status: 'IN_PROGRESS' } : m)); setHalfEnded(false); });
    socket.on('second_half_started', () => { setHalfEnded(false); setTimer((t) => ({ ...t, seconds: 0, currentHalf: 2, running: true })); });
    socket.on('score_updated', ({ homeScore, awayScore }: { homeScore: number; awayScore: number }) => {
      setMatch((m) => (m ? { ...m, homeScore, awayScore } : m));
    });
    socket.on('event_registered', ({ event }: { event: MatchEvent }) => setEvents((prev) => [...prev, event]));
    socket.on('fine_registered', ({ fine }: { fine: Fine }) => setFines((prev) => [...prev, fine]));
    socket.on('colors_updated', ({ homeTeamColor, awayTeamColor }: { homeTeamColor: string; awayTeamColor: string }) => {
      setHomeColor(homeTeamColor); setAwayColor(awayTeamColor);
    });
    socket.on('match_closed', ({ match: m }: { match: Match }) => { setMatch(m); setMatchClosed(true); });
    socket.on('player_expelled', ({ playerId, teamId, minute }: { playerId: string; teamId: string; minute: number }) => {
      setExpulsionAlert({ playerId, teamId, minute });
      setTimeout(() => setExpulsionAlert(null), 6000);
    });
    return () => socket.disconnect();
  }, [matchId, token, fetchTeams, fetchFines]);

  const startMatch = () => socketRef.current?.emit('start_match', { matchId, halfDurationMinutes: halfDuration });
  const startSecondHalf = () => {
    socketRef.current?.emit('start_second_half', { matchId, halfDurationMinutes: halfDuration });
    setHalfEnded(false);
  };
  const openEventModal = (type: EventType, teamId: string) => {
    if (type === 'FOUL') { socketRef.current?.emit('register_event', { matchId: matchId!, teamId, eventType: 'FOUL' }); return; }
    setSelectedPlayerId(''); setSelectedPlayerOutId(''); setEventModal({ type, teamId });
  };
  const registerEvent = () => {
    if (!eventModal) return;
    const payload: { matchId: string; teamId: string; playerId?: string; playerOutId?: string; eventType: EventType } = {
      matchId: matchId!, teamId: eventModal.teamId, eventType: eventModal.type,
    };
    if (selectedPlayerId) payload.playerId = selectedPlayerId;
    if (selectedPlayerOutId) payload.playerOutId = selectedPlayerOutId;
    socketRef.current?.emit('register_event', payload);
    setEventModal(null);
  };
  const closeMatch = () => {
    if (!confirm('¿Cerrar partido? Se generará el acta automáticamente.')) return;
    socketRef.current?.emit('close_match', { matchId });
  };
  const saveColors = () => { socketRef.current?.emit('set_colors', { matchId, homeColor, awayColor }); setShowColors(false); };
  const openFineModal = (teamId: string) => {
    setFineTeamId(teamId); setFineReason('Llegada tarde');
    setFineAmount(tournament?.lateFine ?? 10000); setFineSuccess(false); setFineModal(true);
  };
  const saveFine = async () => {
    if (!match || !fineTeamId || fineAmount <= 0) return;
    setFineSaving(true);
    try {
      const fine = await finesApi.create({ teamId: fineTeamId, tournamentId: match.tournamentId, matchId: matchId!, amount: fineAmount, reason: fineReason, half: timer.currentHalf });
      setFines((prev) => [...prev, fine]); setFineSuccess(true);
      setTimeout(() => { setFineModal(false); setFineSuccess(false); }, 1200);
    } catch (e) { console.error('Error saving fine', e); }
    finally { setFineSaving(false); }
  };
  const downloadActa = async () => {
    try {
      const res = await apiClient.get(`/matches/${matchId}/acta`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a'); a.href = url; a.download = `acta-${matchId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Error downloading acta', e); }
  };

  const modalPlayers = eventModal?.teamId === match?.homeTeamId ? homePlayers : awayPlayers;
  const isInProgress = match?.status === 'IN_PROGRESS';
  const isScheduled = match?.status === 'SCHEDULED';
  const half1Ended = isInProgress && halfEnded && timer.currentHalf === 1;
  const canRegisterEvents = isInProgress && timer.running;
  const allPlayers = [...homePlayers, ...awayPlayers];
  const getPlayerName = (id: string | null) => id ? (allPlayers.find((p) => p.id === id)?.name ?? null) : null;
  const expelledPlayer = expulsionAlert ? allPlayers.find((p) => p.id === expulsionAlert.playerId) : null;
  const expelledTeam = expulsionAlert?.teamId === match?.homeTeamId ? homeTeam : awayTeam;
  const half1Fines = fines.filter((f) => f.half === 1);
  const half2Fines = fines.filter((f) => f.half === 2);
  const half1Total = half1Fines.reduce((s, f) => s + f.amount, 0);
  const half2Total = half2Fines.reduce((s, f) => s + f.amount, 0);
  const totalFines = half1Total + half2Total;
  const teamName = (teamId: string) => teamId === match?.homeTeamId ? homeTeam?.name : awayTeam?.name;
  const eventLog = [...events].filter((e) => e.eventType !== 'SUBSTITUTION').sort((a, b) => a.minute - b.minute);

  const statusLabel = matchClosed ? 'Finalizado'
    : isInProgress ? (halfEnded ? '¡Tiempo!' : 'En curso')
    : 'Programado';
  const statusColor = matchClosed ? 'text-purple-400'
    : isInProgress ? (halfEnded ? 'text-amber-400' : 'text-green-400')
    : 'text-gray-500';

  const refFee = tournament?.refereeFeeEnabled ? (tournament.refereeFee ?? 0) : 0;
  const pendingForTeam = (tid: string) => {
    const finesTotal = fines.filter((f) => f.teamId === tid && f.status === 'PENDING').reduce((s, f) => s + f.amount, 0);
    return finesTotal + refFee;
  };
  const buildBreakdown = (tid: string) => {
    const finesTotal = fines.filter((f) => f.teamId === tid && f.status === 'PENDING').reduce((s, f) => s + f.amount, 0);
    const lines: string[] = [];
    if (finesTotal > 0) lines.push(`Multas: ${fmt(finesTotal)}`);
    if (refFee > 0) lines.push(`Árbitro: ${fmt(refFee)}`);
    return lines.join('\n');
  };

  if (!match) {
    return (
      <div className="min-h-dvh bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Conectando con el partido...</p>
        </div>
      </div>
    );
  }

  // ── Shared: event log grid (used in both mobile and desktop) ──────────────
  const EventLogGrid = (
    <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-y-3">
      <AnimatePresence initial={false}>
        {eventLog.map((event) => {
          const isHome = event.teamId === match.homeTeamId;
          const playerName = getPlayerName(event.playerId);
          return (
            <Fragment key={event.id}>
              {isHome ? (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 justify-end">
                  {playerName && <span className="text-xs text-gray-300 text-right truncate max-w-[90px]">{playerName}</span>}
                  <span className="text-[11px] text-gray-500 tabular-nums shrink-0">{event.minute}'</span>
                  <EventDot type={event.eventType} />
                </motion.div>
              ) : <div />}
              <div className="flex justify-center">
                {/* center dot divider — only show if both sides empty */}
                <div className="w-px h-full" />
              </div>
              {!isHome ? (
                <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5">
                  <EventDot type={event.eventType} />
                  <span className="text-[11px] text-gray-500 tabular-nums shrink-0">{event.minute}'</span>
                  {playerName && <span className="text-xs text-gray-300 truncate max-w-[90px]">{playerName}</span>}
                </motion.div>
              ) : <div />}
            </Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );

  // ── Shared: fines panel content ───────────────────────────────────────────
  const FinesContent = (
    <div className="flex flex-col gap-4">
      <HalfFinesSection label="1er Tiempo" fines={half1Fines} total={half1Total} teamName={teamName} />
      <HalfFinesSection label="2do Tiempo" fines={half2Fines} total={half2Total} teamName={teamName} />
      <div className="border-t border-gray-800 pt-3 mt-auto">
        <div className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total partido</span>
          <span className="text-lg font-black text-amber-300 tabular-nums">{fmt(totalFines)}</span>
        </div>
      </div>
    </div>
  );

  // ── Shared: event buttons ─────────────────────────────────────────────────
  const EventButtons = (
    <div className="space-y-4">
      {[
        { team: homeTeam, id: match.homeTeamId, color: homeColor },
        { team: awayTeam, id: match.awayTeamId, color: awayColor },
      ].map(({ team, id, color }) => (
        <div key={id}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>
            {team?.name ?? 'Equipo'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'FOUL'] as EventType[]).map((type) => (
              <button
                key={type}
                onClick={() => openEventModal(type, id)}
                className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 hover:border-gray-600 rounded-xl py-3 min-h-[44px] px-3 text-xs font-medium transition-all"
              >
                {type === 'GOAL' ? '⚽ Gol' : type === 'YELLOW_CARD' ? '🟨 Amarilla' : type === 'RED_CARD' ? '🟥 Roja' : type === 'SUBSTITUTION' ? '🔄 Cambio' : '⚡ Falta'}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh bg-gray-950 text-white flex flex-col">
      {/* Expulsion toast */}
      <AnimatePresence>
        {expulsionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-950 border border-red-700 rounded-2xl px-5 py-3 shadow-2xl"
          >
            <span className="text-2xl">🟥🟨🟨</span>
            <div>
              <p className="text-sm font-bold text-red-300">¡Expulsión automática — min. {expulsionAlert.minute}!</p>
              <p className="text-xs text-red-400">
                {expelledPlayer ? `#${expelledPlayer.dorsal} ${expelledPlayer.name}` : 'Jugador'} · {expelledTeam?.name ?? 'Equipo'} · 2 amarillas
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-indigo-400 tracking-wide">VOCALIA</span>
        </div>
        <div className="text-xs text-gray-500 font-mono hidden sm:block">{matchId?.slice(0, 8).toUpperCase()}</div>
        <div className="flex items-center gap-2">
          {connected
            ? <><Wifi className="w-4 h-4 text-green-400" /><span className="text-green-400 font-medium text-xs sm:text-sm">En línea</span></>
            : <><WifiOff className="w-4 h-4 text-red-400" /><span className="text-red-400 font-medium text-xs sm:text-sm">Desconectado</span></>}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          MOBILE LAYOUT (md:hidden)
          ══════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col flex-1 min-h-0">

        {/* ── Hero Scoreboard — Google-style ── */}
        <div className="shrink-0 flex items-start px-5 pt-5 pb-4 gap-2">
          {/* Home */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border-[3px] shrink-0 overflow-hidden"
                style={{ borderColor: homeColor, color: homeColor, backgroundColor: homeColor + '18' }}
              >
                {homeTeam?.logoUrl && !homeLogoError
                  ? <img src={homeTeam.logoUrl} alt={homeTeam.name} onError={() => setHomeLogoError(true)} className="w-full h-full object-cover" />
                  : homeTeam?.name?.[0]?.toUpperCase() ?? 'L'}
              </div>
              <span className="text-6xl font-black tabular-nums leading-none" style={{ color: homeColor }}>
                {match.homeScore}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-200 leading-tight truncate">{homeTeam?.name ?? 'Local'}</span>
          </div>

          {/* Center: status + timer */}
          <div className="flex flex-col items-center shrink-0 px-2 pt-3 gap-1">
            <span className={`text-[11px] font-bold ${statusColor}`}>{statusLabel}</span>
            {(isInProgress || matchClosed) && (
              <span className="text-sm font-mono font-bold tabular-nums text-white leading-none">
                {formatTime(timer.seconds)}
              </span>
            )}
            {isInProgress && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-gray-600 uppercase">T{timer.currentHalf}</span>
                {timer.running && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              </div>
            )}
            {halfEnded && isInProgress && (
              <span className="text-[9px] font-bold text-amber-400 animate-pulse mt-0.5">¡Tiempo!</span>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col gap-2 items-end min-w-0">
            <div className="flex items-center gap-3 justify-end">
              <span className="text-6xl font-black tabular-nums leading-none" style={{ color: awayColor }}>
                {match.awayScore}
              </span>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border-[3px] shrink-0 overflow-hidden"
                style={{ borderColor: awayColor, color: awayColor, backgroundColor: awayColor + '18' }}
              >
                {awayTeam?.logoUrl && !awayLogoError
                  ? <img src={awayTeam.logoUrl} alt={awayTeam.name} onError={() => setAwayLogoError(true)} className="w-full h-full object-cover" />
                  : awayTeam?.name?.[0]?.toUpperCase() ?? 'V'}
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-200 text-right leading-tight truncate">{awayTeam?.name ?? 'Visitante'}</span>
          </div>
        </div>

        {/* ── Event log (always visible, capped) ── */}
        {eventLog.length > 0 && (
          <div className="shrink-0 border-t border-gray-800/50 mx-4 pt-3 pb-3 max-h-[160px] overflow-y-auto">
            {EventLogGrid}
          </div>
        )}

        {/* ── Pill tabs ── */}
        <div className="shrink-0 flex gap-2 px-4 py-3 border-y border-gray-800/50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {(
            [
              { id: 'match' as MobileTab, label: 'Partido' },
              { id: 'fines' as MobileTab, label: `Multas${fines.length > 0 ? ` (${fines.length})` : ''}` },
              { id: 'controls' as MobileTab, label: 'Controles' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className={`flex items-center px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all min-h-[36px] ${
                mobileTab === id
                  ? 'bg-white/8 text-white border-white/20'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {mobileTab === 'match' && (
            <div className="p-4 pb-8 space-y-5">
              {/* Primary match action */}
              {!matchClosed && (isScheduled || half1Ended) && (
                <div className="space-y-2">
                  {isScheduled && (
                    <button onClick={startMatch} className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-4 min-h-[52px] rounded-2xl transition-colors text-base">
                      ▶ Iniciar Partido
                    </button>
                  )}
                  {half1Ended && (
                    <button onClick={startSecondHalf} className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-4 min-h-[52px] rounded-2xl transition-colors text-base">
                      ▶ Iniciar 2do Tiempo
                    </button>
                  )}
                </div>
              )}
              {canRegisterEvents && EventButtons}
              {matchClosed && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 text-center py-4">
                  <CheckCircle className="w-14 h-14 text-green-400" />
                  <p className="text-lg font-bold">Partido finalizado</p>
                  <p className="text-sm text-gray-500 max-w-xs">El acta fue generada automáticamente.</p>
                  <button onClick={downloadActa} className="mt-2 bg-indigo-900 hover:bg-indigo-800 border border-indigo-700 text-indigo-300 hover:text-white font-semibold text-sm py-3 min-h-[44px] px-6 rounded-xl transition-all">
                    Descargar Acta PDF
                  </button>
                </motion.div>
              )}
              {matchClosed && (pendingForTeam(match.homeTeamId) > 0 || pendingForTeam(match.awayTeamId) > 0) && (
                <div className="border-t border-gray-800 pt-4 space-y-3">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Pagos pendientes</p>
                  {[
                    { team: homeTeam, id: match.homeTeamId },
                    { team: awayTeam, id: match.awayTeamId },
                  ].map(({ team, id }) => {
                    const total = pendingForTeam(id);
                    if (total <= 0) return null;
                    return (
                      <div key={id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{team?.name ?? 'Equipo'}</p>
                          <p className="text-xs text-amber-400 font-bold tabular-nums">{fmt(total)}</p>
                        </div>
                        <button
                          onClick={() => setPaymentTeamId(id)}
                          className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold py-2 px-4 min-h-[36px] rounded-lg transition-colors"
                        >
                          Registrar pago
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {mobileTab === 'fines' && (
            <div className="p-4 pb-8">{FinesContent}</div>
          )}

          {mobileTab === 'controls' && (
            <div className="p-5 pb-8 flex flex-col gap-5">
              {/* Status */}
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Estado</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${matchClosed ? 'bg-gray-500' : isInProgress ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                  <span className="text-sm font-semibold">{matchClosed ? 'Partido cerrado' : isInProgress ? 'En curso' : 'Programado'}</span>
                </div>
              </div>

              {(!isInProgress || half1Ended) && !matchClosed && (
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Duración por tiempo</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="number" value={halfDuration} onChange={(e) => setHalfDuration(Number(e.target.value))} min={1} max={60}
                      className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 tabular-nums" />
                    <span className="text-xs text-gray-500">min</span>
                  </div>
                </div>
              )}

              {!matchClosed && (
                <div className="flex flex-col gap-2">
                  {isScheduled && (
                    <button onClick={startMatch} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm">▶ Iniciar Partido</button>
                  )}
                  {half1Ended && (
                    <button onClick={startSecondHalf} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm">▶ Iniciar 2do Tiempo</button>
                  )}
                  {isInProgress && (
                    <button onClick={closeMatch} className="w-full bg-gray-800 hover:bg-red-900 border border-gray-700 hover:border-red-700 text-gray-400 hover:text-red-300 font-semibold py-3 min-h-[44px] rounded-xl transition-all text-sm mt-2">
                      Cerrar partido
                    </button>
                  )}
                </div>
              )}

              {isInProgress && (
                <div className="border-t border-gray-800 pt-4">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Registrar multa</p>
                  <p className="text-[10px] text-gray-700 mb-3">Tiempo {timer.currentHalf}</p>
                  <div className="flex flex-col gap-2">
                    {[{ team: homeTeam, id: match.homeTeamId }, { team: awayTeam, id: match.awayTeamId }].map(({ team, id }) => (
                      <button key={id} onClick={() => openFineModal(id)}
                        className="w-full bg-gray-800 hover:bg-amber-950 border border-gray-700 hover:border-amber-800 text-gray-400 hover:text-amber-300 text-xs font-semibold min-h-[44px] py-2 px-3 rounded-lg transition-all text-left">
                        + {team?.name ?? 'Equipo'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-800 pt-4">
                <button onClick={() => setShowColors((v) => !v)}
                  className="flex items-center gap-2 text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest w-full min-h-[44px] transition-colors">
                  Colores de camiseta
                  {showColors ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                <AnimatePresence>
                  {showColors && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 space-y-3">
                      {[{ label: homeTeam?.name ?? 'Local', color: homeColor, set: setHomeColor }, { label: awayTeam?.name ?? 'Visitante', color: awayColor, set: setAwayColor }].map(({ label, color, set }) => (
                        <div key={label}>
                          <label className="text-xs text-gray-500">{label}</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={color} onChange={(e) => set(e.target.value)} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                            <span className="text-xs text-gray-500 font-mono">{color}</span>
                          </div>
                        </div>
                      ))}
                      <button onClick={saveColors} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 min-h-[44px] rounded-lg transition-colors">
                        Guardar colores
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT (hidden md:grid)
          ══════════════════════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-[260px_1fr_280px] flex-1 min-h-0 overflow-hidden">

        {/* Left panel: Controls */}
        <div className="border-r border-gray-800 p-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Estado</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${matchClosed ? 'bg-gray-500' : isInProgress ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-sm font-semibold">{matchClosed ? 'Partido cerrado' : isInProgress ? 'En curso' : 'Programado'}</span>
            </div>
          </div>

          {(!isInProgress || half1Ended) && !matchClosed && (
            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Duración por tiempo</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" value={halfDuration} onChange={(e) => setHalfDuration(Number(e.target.value))} min={1} max={60}
                  className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 tabular-nums" />
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>
          )}

          {!matchClosed && (
            <div className="flex flex-col gap-2">
              {isScheduled && <button onClick={startMatch} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors text-sm">▶ Iniciar Partido</button>}
              {half1Ended && <button onClick={startSecondHalf} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors text-sm">▶ Iniciar 2do Tiempo</button>}
              {isInProgress && <button onClick={closeMatch} className="w-full bg-gray-800 hover:bg-red-900 border border-gray-700 hover:border-red-700 text-gray-400 hover:text-red-300 font-semibold py-2.5 rounded-xl transition-all text-sm mt-2">Cerrar partido</button>}
            </div>
          )}

          {isInProgress && (
            <div className="border-t border-gray-800 pt-4">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Registrar multa</p>
              <p className="text-[10px] text-gray-700 mb-3">Tiempo {timer.currentHalf}</p>
              <div className="flex flex-col gap-2">
                {[{ team: homeTeam, id: match.homeTeamId }, { team: awayTeam, id: match.awayTeamId }].map(({ team, id }) => (
                  <button key={id} onClick={() => openFineModal(id)}
                    className="w-full bg-gray-800 hover:bg-amber-950 border border-gray-700 hover:border-amber-800 text-gray-400 hover:text-amber-300 text-xs font-semibold py-2 px-3 rounded-lg transition-all text-left">
                    + {team?.name ?? 'Equipo'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-800 pt-4">
            <button onClick={() => setShowColors((v) => !v)}
              className="flex items-center gap-2 text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest w-full transition-colors">
              Colores de camiseta
              {showColors ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            <AnimatePresence>
              {showColors && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 space-y-3">
                  {[{ label: homeTeam?.name ?? 'Local', color: homeColor, set: setHomeColor }, { label: awayTeam?.name ?? 'Visitante', color: awayColor, set: setAwayColor }].map(({ label, color, set }) => (
                    <div key={label}>
                      <label className="text-xs text-gray-500">{label}</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={color} onChange={(e) => set(e.target.value)} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" />
                        <span className="text-xs text-gray-500 font-mono">{color}</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={saveColors} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors">Guardar colores</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Scoreboard + Events + Event buttons */}
        <div className="flex flex-col items-center pt-10 gap-8 px-6 overflow-y-auto">
          {/* Scoreboard */}
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-4 shadow-lg overflow-hidden"
                  style={{ borderColor: homeColor, color: homeColor, backgroundColor: homeColor + '22' }}>
                  {homeTeam?.logoUrl && !homeLogoError
                    ? <img src={homeTeam.logoUrl} alt={homeTeam.name} onError={() => setHomeLogoError(true)} className="w-full h-full object-cover" />
                    : homeTeam?.name?.[0]?.toUpperCase() ?? 'L'}
                </div>
                <p className="text-xs font-semibold text-gray-300 text-center leading-tight">{homeTeam?.name ?? 'Local'}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-8xl font-black leading-none" style={{ color: homeColor }}>{match.homeScore}</span>
                  <span className="text-5xl font-thin text-gray-700 mx-1">:</span>
                  <span className="text-8xl font-black leading-none" style={{ color: awayColor }}>{match.awayScore}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-4 shadow-lg overflow-hidden"
                  style={{ borderColor: awayColor, color: awayColor, backgroundColor: awayColor + '22' }}>
                  {awayTeam?.logoUrl && !awayLogoError
                    ? <img src={awayTeam.logoUrl} alt={awayTeam.name} onError={() => setAwayLogoError(true)} className="w-full h-full object-cover" />
                    : awayTeam?.name?.[0]?.toUpperCase() ?? 'V'}
                </div>
                <p className="text-xs font-semibold text-gray-300 text-center leading-tight">{awayTeam?.name ?? 'Visitante'}</p>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-6xl font-mono font-bold tabular-nums tracking-tight">{formatTime(timer.seconds)}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tiempo {timer.currentHalf} de 2</span>
              {timer.running && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              {halfEnded && isInProgress && <span className="text-xs font-semibold text-amber-400 animate-pulse">¡Tiempo finalizado!</span>}
            </div>
          </div>

          {/* Event log */}
          {eventLog.length > 0 && (
            <div className="w-full max-w-sm border-t border-gray-800/60 pt-4">
              {EventLogGrid}
            </div>
          )}

          {canRegisterEvents && <div className="w-full max-w-sm">{EventButtons}</div>}

          {matchClosed && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 text-center mt-4 w-full max-w-sm">
              <CheckCircle className="w-14 h-14 text-green-400" />
              <p className="text-lg font-bold">Partido finalizado</p>
              <p className="text-sm text-gray-500 max-w-xs">El acta fue generada y enviada por WhatsApp al delegado del equipo local.</p>
              <button onClick={downloadActa} className="mt-2 bg-indigo-900 hover:bg-indigo-800 border border-indigo-700 text-indigo-300 hover:text-white font-semibold text-sm py-3 px-6 rounded-xl transition-all">
                Descargar Acta PDF
              </button>
              {(pendingForTeam(match.homeTeamId) > 0 || pendingForTeam(match.awayTeamId) > 0) && (
                <div className="w-full border-t border-gray-800 pt-4 mt-2 space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-left">Pagos pendientes</p>
                  {[
                    { team: homeTeam, id: match.homeTeamId },
                    { team: awayTeam, id: match.awayTeamId },
                  ].map(({ team, id }) => {
                    const total = pendingForTeam(id);
                    if (total <= 0) return null;
                    return (
                      <div key={id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">{team?.name ?? 'Equipo'}</p>
                          <p className="text-xs text-amber-400 font-bold tabular-nums">{fmt(total)}</p>
                        </div>
                        <button
                          onClick={() => setPaymentTeamId(id)}
                          className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold py-2 px-4 min-h-[36px] rounded-lg transition-colors"
                        >
                          Registrar pago
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right panel: Fines */}
        <div className="border-l border-gray-800 flex flex-col min-h-0">
          <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Multas ({fines.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">{FinesContent}</div>
        </div>
      </div>

      {/* ── Fine modal ── */}
      <AnimatePresence>
        {fineModal && (
          <motion.div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setFineModal(false); }}>
            <motion.div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base text-amber-300">Registrar Multa</h3>
                <button onClick={() => setFineModal(false)} className="text-gray-600 hover:text-white p-1"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-gray-600 mb-5">Tiempo {timer.currentHalf}</p>
              {fineSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                  <p className="text-sm font-semibold text-green-300">Multa registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Equipo</label>
                    <div className="flex gap-2 mt-1.5">
                      {[{ id: match.homeTeamId, name: homeTeam?.name ?? 'Local' }, { id: match.awayTeamId, name: awayTeam?.name ?? 'Visitante' }].map(({ id, name }) => (
                        <button key={id} onClick={() => setFineTeamId(id)}
                          className={`flex-1 py-3 min-h-[44px] rounded-xl text-xs font-semibold border transition-all ${fineTeamId === id ? 'bg-amber-900 border-amber-600 text-amber-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Motivo</label>
                    <select value={fineReason} onChange={(e) => { setFineReason(e.target.value); if (['Llegada tarde', 'Equipo incompleto'].includes(e.target.value)) setFineAmount(tournament?.lateFine ?? 10000); }}
                      className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 min-h-[44px] text-sm text-white focus:outline-none focus:border-amber-500 transition-colors">
                      <option>Llegada tarde</option><option>Equipo incompleto</option><option>Conducta del banco</option><option>Juego brusco</option><option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Monto ($)</label>
                    <input type="number" inputMode="numeric" min={0} value={fineAmount} onChange={(e) => setFineAmount(Number(e.target.value))}
                      className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 min-h-[44px] text-sm text-white focus:outline-none focus:border-amber-500 transition-colors tabular-nums" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setFineModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors">Cancelar</button>
                    <button onClick={saveFine} disabled={fineSaving || !fineTeamId || fineAmount <= 0}
                      className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors">
                      {fineSaving ? 'Guardando...' : 'Registrar'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Payment modal ── */}
      <AnimatePresence>
        {paymentTeamId && match && (
          <PaymentModal
            matchId={match.id}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            defaultTeamId={paymentTeamId}
            defaultAmount={pendingForTeam(paymentTeamId)}
            amountBreakdown={buildBreakdown(paymentTeamId)}
            onClose={() => setPaymentTeamId(null)}
            onSuccess={fetchFines}
          />
        )}
      </AnimatePresence>

      {/* ── Event modal ── */}
      <AnimatePresence>
        {eventModal && (
          <motion.div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setEventModal(null); }}>
            <motion.div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base">
                  {eventModal.type === 'GOAL' ? '⚽ Gol' : eventModal.type === 'YELLOW_CARD' ? '🟨 Amarilla' : eventModal.type === 'RED_CARD' ? '🟥 Roja' : '🔄 Cambio'}
                </h3>
                <button onClick={() => setEventModal(null)} className="text-gray-600 hover:text-white p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium">{eventModal.type === 'SUBSTITUTION' ? 'Jugador que entra' : 'Jugador'}</label>
                  <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 min-h-[44px] text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="">Sin especificar</option>
                    {modalPlayers.sort((a, b) => a.dorsal - b.dorsal).map((p) => <option key={p.id} value={p.id}>#{p.dorsal} {p.name}</option>)}
                  </select>
                </div>
                {eventModal.type === 'SUBSTITUTION' && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Jugador que sale</label>
                    <select value={selectedPlayerOutId} onChange={(e) => setSelectedPlayerOutId(e.target.value)}
                      className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 min-h-[44px] text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                      <option value="">Sin especificar</option>
                      {modalPlayers.sort((a, b) => a.dorsal - b.dorsal).map((p) => <option key={p.id} value={p.id}>#{p.dorsal} {p.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setEventModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors">Cancelar</button>
                  <button onClick={registerEvent} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors">Registrar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function HalfFinesSection({ label, fines, total, teamName }: {
  label: string; fines: Fine[]; total: number; teamName: (id: string) => string | undefined;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-[9px] font-bold text-gray-600 tabular-nums">{fmt(total)}</span>
      </div>
      {fines.length === 0 ? (
        <p className="text-xs text-gray-700 pl-1">Sin multas</p>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {fines.map((fine) => (
              <motion.div key={fine.id} initial={{ x: 12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="flex items-start gap-2 bg-gray-900/70 rounded-lg px-3 py-2.5 min-h-[40px]">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-amber-200/80 truncate">{teamName(fine.teamId) ?? 'Equipo'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{fine.reason}</p>
                </div>
                <span className="text-xs font-bold text-amber-300 tabular-nums whitespace-nowrap shrink-0">{fmt(fine.amount)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
