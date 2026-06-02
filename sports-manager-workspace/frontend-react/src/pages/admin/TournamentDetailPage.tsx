import { useState, Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Trophy, Users, Calendar, BarChart2, Plus,
  ChevronDown, ChevronUp, X, Loader2, Play, Swords, Shield,
  ExternalLink, FileDown, Settings, Pencil, Printer,
  Lock, LockOpen,
} from 'lucide-react';
import { tournamentsApi } from '../../api/tournaments.api';
import { publicApi, type ScorerRow } from '../../api/public.api';
import { teamsApi, playersApi } from '../../api/teams.api';
import { matchesApi } from '../../api/matches.api';
import { balanceApi } from '../../api/balance.api';
import { roundsApi } from '../../api/rounds.api';
import { Button } from '../../components/ui/button';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { TournamentConfigTab } from './TournamentConfigTab';
import { PaymentModal } from '../../components/ui/PaymentModal';
import type { Tournament, Team, Match, Player, MatchEvent, TeamBalance, LedgerEntry, TournamentRound } from '../../types';

const SPORT_LABEL = { FOOTBALL: 'Fútbol', FUTSAL: 'Fútbol Sala' };
const FORMAT_LABEL = {
  ROUND_ROBIN: 'Round Robin',
  DIRECT_ELIMINATION: 'Eliminación Directa',
  GROUPS_ELIMINATION: 'Grupos + Eliminación',
};
const STATUS = {
  DRAFT:    { label: 'Borrador',   color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  ACTIVE:   { label: 'Activo',     color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  FINISHED: { label: 'Finalizado', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
};
const MATCH_STATUS = {
  SCHEDULED:   { label: 'Programado', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  IN_PROGRESS: { label: 'En curso',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  FINISHED:    { label: 'Finalizado', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

type Tab = 'teams' | 'fixture' | 'standings' | 'scorers' | 'balances' | 'config';

function computeStandings(teams: Team[], matches: Match[]) {
  const stats: Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }> = {};
  for (const t of teams) stats[t.id] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
  for (const m of matches) {
    if (m.status !== 'FINISHED') continue;
    const home = stats[m.homeTeamId];
    const away = stats[m.awayTeamId];
    if (!home || !away) continue;
    home.played++; away.played++;
    home.gf += m.homeScore; home.ga += m.awayScore;
    away.gf += m.awayScore; away.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { home.won++; home.pts += 3; away.lost++; }
    else if (m.homeScore < m.awayScore) { away.won++; away.pts += 3; home.lost++; }
    else { home.drawn++; home.pts++; away.drawn++; away.pts++; }
  }
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));
  return Object.entries(stats)
    .map(([id, s]) => ({ team: teamMap[id], ...s, gd: s.gf - s.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('teams');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState<string | null>(null); // teamId
  const [playerForm, setPlayerForm] = useState({ name: '', dorsal: '' });
  const [playerPhotoUrl, setPlayerPhotoUrl] = useState<string | null>(null);
  const [showEditPlayer, setShowEditPlayer] = useState<Player | null>(null);
  const [editPlayerForm, setEditPlayerForm] = useState({ name: '', dorsal: '' });
  const [editPlayerPhotoUrl, setEditPlayerPhotoUrl] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showEditTeam, setShowEditTeam] = useState<Team | null>(null);
  const [editTeamForm, setEditTeamForm] = useState({ name: '', primaryColor: '#10b981', secondaryColor: '#ffffff' });
  const [editTeamLogoUrl, setEditTeamLogoUrl] = useState<string | null>(null);

  const handleEditTeam = (team: Team) => {
    setShowEditTeam(team);
    setEditTeamForm({ name: team.name, primaryColor: team.primaryColor ?? '#10b981', secondaryColor: team.secondaryColor ?? '#ffffff' });
    setEditTeamLogoUrl(team.logoUrl ?? null);
  };

  const handleEditPlayer = (player: Player) => {
    setShowEditPlayer(player);
    setEditPlayerForm({ name: player.name, dorsal: String(player.dorsal) });
    setEditPlayerPhotoUrl(player.photoUrl);
  };

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!),
    enabled: !!id,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['tournament-teams', id],
    queryFn: () => teamsApi.getByTournament(id!),
    enabled: !!id,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: () => tournamentsApi.getMatches(id!),
    enabled: !!id,
  });

  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds', id],
    queryFn: () => roundsApi.listByTournament(id!),
    enabled: !!id,
  });

  const onError = (err: unknown) => {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error inesperado';
    setMutationError(Array.isArray(msg) ? msg[0] : msg);
    setTimeout(() => setMutationError(null), 4000);
  };

  const addTeam = useMutation({
    mutationFn: () => teamsApi.create({
      name: teamName.trim(),
      tournamentId: id!,
      ...(teamLogoUrl ? { logoUrl: teamLogoUrl } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament-teams', id] });
      setShowAddTeam(false);
      setTeamName('');
      setTeamLogoUrl(null);
    },
    onError,
  });

  const editTeam = useMutation({
    mutationFn: () => teamsApi.update(showEditTeam!.id, {
      name: editTeamForm.name.trim(),
      primaryColor: editTeamForm.primaryColor,
      secondaryColor: editTeamForm.secondaryColor,
      logoUrl: editTeamLogoUrl,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament-teams', id] });
      setShowEditTeam(null);
      setEditTeamLogoUrl(null);
    },
    onError,
  });

  const addPlayer = useMutation({
    mutationFn: () => playersApi.create({
      name: playerForm.name.trim(),
      teamId: showAddPlayer!,
      dorsal: Number(playerForm.dorsal),
      ...(playerPhotoUrl ? { photoUrl: playerPhotoUrl } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-players', showAddPlayer] });
      setShowAddPlayer(null);
      setPlayerForm({ name: '', dorsal: '' });
      setPlayerPhotoUrl(null);
    },
    onError,
  });

  const updatePlayer = useMutation({
    mutationFn: () => playersApi.update(showEditPlayer!.id, {
      name: editPlayerForm.name.trim(),
      dorsal: Number(editPlayerForm.dorsal),
      photoUrl: editPlayerPhotoUrl,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-players', showEditPlayer!.teamId] });
      setShowEditPlayer(null);
      setEditPlayerPhotoUrl(null);
    },
    onError,
  });

  const updateConfig = useMutation({
    mutationFn: (data: Parameters<typeof tournamentsApi.update>[1]) =>
      tournamentsApi.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament', id] });
    },
    onError,
  });

  const generateFixture = useMutation({
    mutationFn: () => tournamentsApi.generateFixture(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament', id] });
      qc.invalidateQueries({ queryKey: ['tournament-matches', id] });
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      setTab('fixture');
    },
    onError,
  });

  const finishTournament = useMutation({
    mutationFn: () => tournamentsApi.update(id!, { status: 'FINISHED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament', id] });
      qc.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={24} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!tournament) return null;

  const status = STATUS[tournament.status];
  const matchesByStage = matches.reduce<Record<number, Match[]>>((acc, m) => {
    const s = m.stage ?? 1;
    if (!acc[s]) acc[s] = [];
    acc[s].push(m);
    return acc;
  }, {});
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'teams',     label: 'Equipos',       icon: Users    },
    { key: 'fixture',   label: 'Fixture',       icon: Calendar },
    { key: 'standings', label: 'Posiciones',    icon: BarChart2 },
    { key: 'scorers',   label: 'Goleadores',    icon: Swords   },
    { key: 'balances',  label: 'Saldos',        icon: Trophy   },
    { key: 'config',    label: 'Configuración', icon: Settings },
  ];

  return (
    <div>
      {/* Error toast */}
      <AnimatePresence>
        {mutationError && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 200,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '12px 18px',
              color: '#fca5a5', fontSize: 13, fontWeight: 600,
              backdropFilter: 'blur(8px)',
            }}
          >
            {mutationError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back + header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/admin/tournaments')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#475569',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '4px 0', marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} /> Torneos
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {tournament.logoUrl
                  ? <img src={tournament.logoUrl} alt={tournament.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Trophy size={18} color="#10b981" />}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.5px' }}>
                {tournament.name}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge label={SPORT_LABEL[tournament.sportType]} color="#3b82f6" />
              <Badge label={FORMAT_LABEL[tournament.format]} color="#8b5cf6" />
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                color: status.color, background: status.bg,
              }}>
                {status.label}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {tournament.status === 'DRAFT' && teams.length >= 2 && matches.length === 0 && (
              <Button onClick={() => generateFixture.mutate()} disabled={generateFixture.isPending}>
                {generateFixture.isPending
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Generando...</>
                  : <><Play size={14} style={{ marginRight: 6 }} />Generar fixture</>}
              </Button>
            )}
            {tournament.status === 'ACTIVE' && (
              <Button variant="outline" onClick={() => finishTournament.mutate()} disabled={finishTournament.isPending}>
                Finalizar torneo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: 4,
        width: 'fit-content',
      }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 9, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              background: tab === key ? 'rgba(16,185,129,0.12)' : 'transparent',
              color: tab === key ? '#10b981' : '#475569',
            }}
          >
            <Icon size={14} />
            {label}
            {key === 'teams' && teams.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: tab === key ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                color: tab === key ? '#10b981' : '#64748b',
                padding: '1px 6px', borderRadius: 100,
              }}>{teams.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'teams' && (
            <TeamsTab
              teams={teams}
              tournament={tournament}
              onAddTeam={() => setShowAddTeam(true)}
              onAddPlayer={(teamId) => setShowAddPlayer(teamId)}
              onEditPlayer={handleEditPlayer}
              onEditTeam={handleEditTeam}
              tournamentId={id!}
            />
          )}
          {tab === 'balances' && (
            <BalancesTab tournamentId={id!} teams={teams} />
          )}
          {tab === 'fixture' && (
            <FixtureTab
              matches={matches}
              matchesByStage={matchesByStage}
              teamMap={teamMap}
              tournament={tournament}
              tournamentStatus={tournament.status}
              teamsCount={teams.length}
              rounds={rounds}
              onGenerate={() => generateFixture.mutate()}
              isGenerating={generateFixture.isPending}
            />
          )}
          {tab === 'standings' && (
            <StandingsTab teams={teams} matches={matches} format={tournament.format} />
          )}
          {tab === 'scorers' && (
            <AdminScorersTab tournamentId={id!} />
          )}
          {tab === 'config' && (
            <TournamentConfigTab
              tournament={tournament}
              onSave={(data) => updateConfig.mutateAsync(data)}
              isSaving={updateConfig.isPending}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add team modal */}
      <AnimatePresence>
        {showAddTeam && (
          <Modal onClose={() => { setShowAddTeam(false); setTeamLogoUrl(null); }}>
            <h2 style={modalTitle}>Agregar equipo</h2>
            <form onSubmit={(e) => { e.preventDefault(); addTeam.mutate(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ paddingTop: 20 }}>
                  <ImageUpload value={teamLogoUrl} onChange={setTeamLogoUrl} shape="square" size={68} placeholder="Logo" folder="team-logos" />
                </div>
                <Field label="Nombre del equipo" style={{ flex: 1 }}>
                  <input
                    value={teamName} onChange={(e) => setTeamName(e.target.value)}
                    required placeholder="Los Cóndores" style={inputStyle} autoFocus
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => { setShowAddTeam(false); setTeamLogoUrl(null); }}>Cancelar</Button>
                <Button type="submit" disabled={addTeam.isPending}>
                  {addTeam.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Agregar'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit team modal */}
      <AnimatePresence>
        {showEditTeam && (
          <Modal onClose={() => { setShowEditTeam(null); setEditTeamLogoUrl(null); }}>
            <h2 style={modalTitle}>Editar equipo</h2>
            <form onSubmit={(e) => { e.preventDefault(); editTeam.mutate(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ paddingTop: 20 }}>
                  <ImageUpload value={editTeamLogoUrl} onChange={setEditTeamLogoUrl} shape="square" size={68} placeholder="Logo" folder="team-logos" />
                </div>
                <Field label="Nombre del equipo" style={{ flex: 1 }}>
                  <input
                    value={editTeamForm.name}
                    onChange={(e) => setEditTeamForm({ ...editTeamForm, name: e.target.value })}
                    required placeholder="Los Cóndores" style={inputStyle} autoFocus
                  />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Color principal">
                  <input
                    type="color" value={editTeamForm.primaryColor}
                    onChange={(e) => setEditTeamForm({ ...editTeamForm, primaryColor: e.target.value })}
                    style={{ ...inputStyle, padding: 4, height: 42, cursor: 'pointer' }}
                  />
                </Field>
                <Field label="Color secundario">
                  <input
                    type="color" value={editTeamForm.secondaryColor}
                    onChange={(e) => setEditTeamForm({ ...editTeamForm, secondaryColor: e.target.value })}
                    style={{ ...inputStyle, padding: 4, height: 42, cursor: 'pointer' }}
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => { setShowEditTeam(null); setEditTeamLogoUrl(null); }}>Cancelar</Button>
                <Button type="submit" disabled={editTeam.isPending}>
                  {editTeam.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add player modal */}
      <AnimatePresence>
        {showAddPlayer && (
          <Modal onClose={() => { setShowAddPlayer(null); setPlayerPhotoUrl(null); }}>
            <h2 style={modalTitle}>Agregar jugador</h2>
            <form onSubmit={(e) => { e.preventDefault(); addPlayer.mutate(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ paddingTop: 20 }}>
                  <ImageUpload value={playerPhotoUrl} onChange={setPlayerPhotoUrl} shape="circle" size={68} placeholder="Foto" folder="player-photos" uploadLabel="Eliminando fondo..." />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Nombre">
                    <input
                      value={playerForm.name}
                      onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                      required placeholder="Juan García" style={inputStyle} autoFocus
                    />
                  </Field>
                  <Field label="Dorsal">
                    <input
                      type="number" min={1} max={99}
                      value={playerForm.dorsal}
                      onChange={(e) => setPlayerForm({ ...playerForm, dorsal: e.target.value })}
                      required placeholder="10" style={inputStyle}
                    />
                  </Field>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => { setShowAddPlayer(null); setPlayerPhotoUrl(null); }}>Cancelar</Button>
                <Button type="submit" disabled={addPlayer.isPending}>
                  {addPlayer.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Agregar'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit player modal */}
      <AnimatePresence>
        {showEditPlayer && (
          <Modal onClose={() => { setShowEditPlayer(null); setEditPlayerPhotoUrl(null); }}>
            <h2 style={modalTitle}>Editar jugador</h2>
            <form onSubmit={(e) => { e.preventDefault(); updatePlayer.mutate(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ paddingTop: 20 }}>
                  <ImageUpload value={editPlayerPhotoUrl} onChange={setEditPlayerPhotoUrl} shape="circle" size={68} placeholder="Foto" folder="player-photos" uploadLabel="Eliminando fondo..." />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Nombre">
                    <input
                      value={editPlayerForm.name}
                      onChange={(e) => setEditPlayerForm({ ...editPlayerForm, name: e.target.value })}
                      required placeholder="Juan García" style={inputStyle} autoFocus
                    />
                  </Field>
                  <Field label="Dorsal">
                    <input
                      type="number" min={1} max={99}
                      value={editPlayerForm.dorsal}
                      onChange={(e) => setEditPlayerForm({ ...editPlayerForm, dorsal: e.target.value })}
                      required placeholder="10" style={inputStyle}
                    />
                  </Field>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => { setShowEditPlayer(null); setEditPlayerPhotoUrl(null); }}>Cancelar</Button>
                <Button type="submit" disabled={updatePlayer.isPending}>
                  {updatePlayer.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-live { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.35); } }
      `}</style>
    </div>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────

function TeamsTab({ teams, tournament, onAddTeam, onAddPlayer, onEditPlayer, onEditTeam, tournamentId }: {
  teams: Team[];
  tournament: Tournament | undefined;
  onAddTeam: () => void;
  onAddPlayer: (teamId: string) => void;
  onEditPlayer: (player: Player) => void;
  onEditTeam: (team: Team) => void;
  tournamentId: string;
}) {
  const { data: balances = [] } = useQuery({
    queryKey: ['balances', tournamentId],
    queryFn: () => balanceApi.getByTournament(tournamentId),
    staleTime: 30_000,
  });
  const balanceMap = Object.fromEntries(balances.map((b) => [b.teamId, b.balance]));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button onClick={onAddTeam}>
          <Plus size={14} style={{ marginRight: 6 }} />Agregar equipo
        </Button>
      </div>
      {teams.length === 0 ? (
        <EmptyState icon={Shield} text="Sin equipos aún. Agregá el primero para empezar." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <TeamCard
                team={team}
                tournament={tournament}
                balance={balanceMap[team.id] ?? null}
                onAddPlayer={() => onAddPlayer(team.id)}
                onEditPlayer={onEditPlayer}
                onEditTeam={() => onEditTeam(team)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team, tournament, balance, onAddPlayer, onEditPlayer, onEditTeam }: { team: Team; tournament: Tournament | undefined; balance: number | null; onAddPlayer: () => void; onEditPlayer: (player: Player) => void; onEditTeam: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['team-players', team.id],
    queryFn: () => playersApi.getByTeam(team.id),
    enabled: expanded,
  });

  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TeamLogo team={team} size={36} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{team.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {balance !== null && balance < 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: '#ef4444', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              padding: '2px 8px', borderRadius: 100,
            }}>
              Debe {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.abs(balance))}
            </span>
          )}
          {balance !== null && balance === 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: '#10b981', background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
              padding: '2px 8px', borderRadius: 100,
            }}>
              Al día
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEditTeam(); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', color: '#64748b',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)';
              (e.currentTarget as HTMLElement).style.color = '#10b981';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.color = '#64748b';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <Pencil size={12} />
          </button>
          {expanded
            ? <ChevronUp size={15} color="#475569" />
            : <ChevronDown size={15} color="#475569" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div style={{ padding: '12px 18px 16px' }}>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <Loader2 size={16} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : players.length === 0 ? (
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px' }}>Sin jugadores aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {players.map((p) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      onEdit={() => onEditPlayer(p)}
                      onPrint={() => tournament && printCarnets([p], team, tournament)}
                    />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="outline" onClick={onAddPlayer}>
                  <Plus size={13} style={{ marginRight: 5 }} />Agregar jugador
                </Button>
                {players.length > 0 && tournament && (
                  <Button variant="outline" onClick={() => printCarnets(players, team, tournament)}>
                    <Printer size={13} style={{ marginRight: 5 }} />Imprimir carnets
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerRow({ player, onEdit, onPrint }: { player: Player; onEdit: () => void; onPrint: () => void }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 10px', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
    >
      <div onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}>
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }} />
        )}
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#64748b',
          fontVariantNumeric: 'tabular-nums', width: 24, textAlign: 'right', flexShrink: 0,
        }}>
          #{player.dorsal}
        </span>
        <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{player.name}</span>
      </div>
      <button
        onClick={onPrint}
        title="Imprimir carnet"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          background: 'transparent', border: '1px solid transparent',
          cursor: 'pointer', color: '#475569',
          transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)';
          (e.currentTarget as HTMLElement).style.color = '#10b981';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = '#475569';
          (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
        }}
      >
        <Printer size={12} />
      </button>
    </div>
  );
}

// ─── Fixture Tab ──────────────────────────────────────────────────────────────

type FixtureSubTab = 'live' | 'today' | 'all';

function StageCloseButton({ tournamentId, stage }: { tournamentId: string; stage: number }) {
  const [confirming, setConfirming] = useState(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => roundsApi.closeRound(tournamentId, stage),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rounds', tournamentId] });
      setConfirming(false);
    },
  });

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 11px', borderRadius: 7, cursor: 'pointer',
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
          color: '#f87171', fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
      >
        <Lock size={10} /> Cerrar jornada
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>¿Confirmar cierre?</span>
      <button onClick={() => setConfirming(false)} style={{
        padding: '3px 9px', borderRadius: 6, height: 26, cursor: 'pointer',
        background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
        color: '#475569', fontSize: 11, fontWeight: 600,
      }}>No</button>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 6, height: 26, cursor: 'pointer',
        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
        color: '#ef4444', fontSize: 11, fontWeight: 700,
        opacity: mutation.isPending ? 0.7 : 1,
      }}>
        {mutation.isPending && <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />}
        Sí, cerrar
      </button>
    </div>
  );
}

function FixtureTab({ matches, matchesByStage, teamMap, tournament, tournamentStatus, teamsCount, rounds, onGenerate, isGenerating }: {
  matches: Match[];
  matchesByStage: Record<number, Match[]>;
  teamMap: Record<string, Team>;
  tournament: import('../../types').Tournament;
  tournamentStatus: string;
  teamsCount: number;
  rounds: TournamentRound[];
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const [sub, setSub] = useState<FixtureSubTab>('live');

  if (matches.length === 0) {
    if (teamsCount < 2) {
      return <EmptyState icon={Calendar} text="Necesitás al menos 2 equipos para generar el fixture." />;
    }
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <Swords size={36} color="#334155" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>Fixture no generado</p>
        <p style={{ fontSize: 13, color: '#334155', margin: '0 0 24px' }}>
          Tenés {teamsCount} equipos listos. Generá el fixture para empezar.
        </p>
        <Button onClick={onGenerate} disabled={isGenerating}>
          {isGenerating
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Generando...</>
            : <><Play size={14} style={{ marginRight: 6 }} />Generar fixture</>}
        </Button>
      </div>
    );
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const liveMatches  = matches.filter(m => m.status === 'IN_PROGRESS');
  const todayMatches = matches.filter(m => {
    if (m.status === 'IN_PROGRESS') return false;
    if (!m.scheduledAt) return false;
    const d = new Date(m.scheduledAt);
    return d >= todayStart && d <= todayEnd;
  });

  const stages = Object.keys(matchesByStage).map(Number).sort((a, b) => a - b);
  const closedStageSet = new Set(rounds.filter(r => r.status === 'CLOSED').map(r => r.stage));
  const openStages   = stages.filter(s => !closedStageSet.has(s));
  const closedStages = stages.filter(s => closedStageSet.has(s));

  const SUB_TABS: { key: FixtureSubTab; label: string; count?: number; dot?: boolean }[] = [
    { key: 'live',  label: 'En Vivo',  count: liveMatches.length,  dot: liveMatches.length > 0 },
    { key: 'today', label: 'Hoy',      count: todayMatches.length },
    { key: 'all',   label: 'Jornadas' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 3 }}>
        {SUB_TABS.map(({ key, label, count, dot }) => {
          const active = sub === key;
          return (
            <button
              key={key}
              onClick={() => setSub(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                background: active
                  ? key === 'live' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)'
                  : 'transparent',
                color: active
                  ? key === 'live' ? '#ef4444' : '#f1f5f9'
                  : '#475569',
              }}
            >
              {dot && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0,
                  animation: active ? 'pulse-live 1.4s ease-in-out infinite' : 'none',
                }} />
              )}
              {label}
              {count !== undefined && count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: active
                    ? key === 'live' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  color: active ? (key === 'live' ? '#ef4444' : '#94a3b8') : '#475569',
                  padding: '1px 6px', borderRadius: 100,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sub}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {sub === 'live' && (
            liveMatches.length === 0
              ? <EmptyState icon={Play} text="No hay partidos en vivo en este momento." />
              : <MatchList matches={liveMatches} teamMap={teamMap} tournament={tournament} />
          )}
          {sub === 'today' && (
            todayMatches.length === 0
              ? <EmptyState icon={Calendar} text="No hay partidos programados para hoy." />
              : <MatchList matches={todayMatches} teamMap={teamMap} tournament={tournament} />
          )}
          {sub === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Jornadas abiertas ── */}
              {openStages.map((stage) => (
                <div key={stage}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LockOpen size={11} color="#334155" />
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: 0, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                        Jornada {stage}
                      </h3>
                    </div>
                    <StageCloseButton tournamentId={tournament.id} stage={stage} />
                  </div>
                  <MatchList matches={matchesByStage[stage]} teamMap={teamMap} tournament={tournament} roundClosed={false} />
                </div>
              ))}

              {/* ── Divisor ── */}
              {closedStages.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Lock size={10} color="#2d3748" />
                    <span style={{ fontSize: 10, color: '#2d3748', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      Jornadas cerradas
                    </span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                </div>
              )}

              {/* ── Jornadas cerradas ── */}
              {closedStages.map((stage) => (
                <div key={stage} style={{ opacity: 0.75 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Lock size={11} color="#2d3748" />
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#2d3748', margin: 0, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      Jornada {stage}
                    </h3>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 8,
                      background: 'rgba(71,85,105,0.12)', border: '1px solid rgba(71,85,105,0.2)',
                      color: '#475569',
                    }}>CERRADA</span>
                  </div>
                  <MatchList matches={matchesByStage[stage]} teamMap={teamMap} tournament={tournament} roundClosed={true} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MatchList({ matches, teamMap, tournament, roundClosed = false }: {
  matches: Match[];
  teamMap: Record<string, Team>;
  tournament: import('../../types').Tournament;
  roundClosed?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {matches.map((match, i) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.22 }}
        >
          <MatchCard match={match} teamMap={teamMap} tournament={tournament} roundClosed={roundClosed} />
        </motion.div>
      ))}
    </div>
  );
}

function EventIcon({ type }: { type: MatchEvent['eventType'] }) {
  if (type === 'GOAL') return (
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', flexShrink: 0, boxShadow: '0 0 5px #10b98170' }} />
  );
  if (type === 'YELLOW_CARD') return (
    <div style={{ width: 8, height: 11, borderRadius: 2, background: '#eab308', flexShrink: 0, boxShadow: '0 0 4px #eab30870' }} />
  );
  if (type === 'RED_CARD') return (
    <div style={{ width: 8, height: 11, borderRadius: 2, background: '#ef4444', flexShrink: 0, boxShadow: '0 0 4px #ef444470' }} />
  );
  return null;
}

function CardPip({ color, count }: { color: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <div style={{
        width: 9, height: 12, borderRadius: 2,
        background: color, flexShrink: 0,
        boxShadow: `0 0 5px ${color}70`,
      }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </span>
    </div>
  );
}

function MatchCard({ match, teamMap, tournament, roundClosed = false }: {
  match: Match;
  teamMap: Record<string, Team>;
  tournament: import('../../types').Tournament;
  roundClosed?: boolean;
}) {
  const qc = useQueryClient();
  const home = teamMap[match.homeTeamId];
  const away = teamMap[match.awayTeamId];
  const isLive = match.status === 'IN_PROGRESS';
  const isDone = match.status === 'FINISHED';

  const [editing, setEditing] = useState(false);
  const [dateValue, setDateValue] = useState(match.scheduledAt ? match.scheduledAt.slice(0, 16) : '');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloadingActa, setDownloadingActa] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const handleDownloadActa = async () => {
    setDownloadingActa(true);
    try {
      const blob = await matchesApi.getActa(match.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acta-${match.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error downloading acta', e);
    } finally {
      setDownloadingActa(false);
    }
  };

  const { data: matchData } = useQuery({
    queryKey: ['match-events', match.id],
    queryFn: () => matchesApi.getById(match.id),
    enabled: match.status !== 'SCHEDULED',
    staleTime: 30_000,
  });
  const events = (matchData?.events ?? []) as MatchEvent[];

  const { data: homePlayers = [] } = useQuery({
    queryKey: ['team-players', match.homeTeamId],
    queryFn: () => playersApi.getByTeam(match.homeTeamId),
    enabled: isLive,
    staleTime: 60_000,
  });
  const { data: awayPlayers = [] } = useQuery({
    queryKey: ['team-players', match.awayTeamId],
    queryFn: () => playersApi.getByTeam(match.awayTeamId),
    enabled: isLive,
    staleTime: 60_000,
  });
  const allPlayers = [...homePlayers, ...awayPlayers];
  const getPlayerName = (playerId: string | null) =>
    playerId ? (allPlayers.find(p => p.id === playerId)?.name ?? null) : null;

  const liveEventLog = isLive
    ? events
        .filter(e => e.eventType !== 'SUBSTITUTION')
        .sort((a, b) => a.minute - b.minute)
    : [];

  const homeYellow = events.filter(e => e.teamId === match.homeTeamId && e.eventType === 'YELLOW_CARD').length;
  const homeRed    = events.filter(e => e.teamId === match.homeTeamId && e.eventType === 'RED_CARD').length;
  const awayYellow = events.filter(e => e.teamId === match.awayTeamId && e.eventType === 'YELLOW_CARD').length;
  const awayRed    = events.filter(e => e.teamId === match.awayTeamId && e.eventType === 'RED_CARD').length;

  const homeColor = match.homeTeamColor ?? home?.primaryColor ?? '#3b82f6';
  const awayColor = match.awayTeamColor ?? away?.primaryColor ?? '#8b5cf6';
  const minute = isLive ? Math.floor((match.timerSeconds ?? 0) / 60) : null;

  const saveSchedule = useMutation({
    mutationFn: () => matchesApi.updateSchedule(match.id, dateValue || null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament-matches'] });
      setEditing(false);
      setSaveError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo guardar la fecha';
      setSaveError(Array.isArray(msg) ? msg[0] : msg);
      setTimeout(() => setSaveError(null), 3000);
    },
  });

  const formattedDate = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleString('es-CO', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  const openVocalia = () => window.open(`/admin/vocalia/${match.id}`, `vocalia-${match.id}`, 'width=1100,height=700');

  return (
    <div style={{
      borderRadius: 14,
      border: isLive
        ? '1px solid rgba(16,185,129,0.35)'
        : isDone
        ? '1px solid rgba(255,255,255,0.05)'
        : '1px solid rgba(255,255,255,0.08)',
      background: isLive
        ? 'rgba(16,185,129,0.025)'
        : isDone
        ? 'rgba(255,255,255,0.01)'
        : 'rgba(255,255,255,0.02)',
      boxShadow: isLive
        ? '0 0 0 1px rgba(16,185,129,0.06), 0 4px 32px rgba(16,185,129,0.06)'
        : 'none',
      overflow: 'hidden',
      transition: 'box-shadow 0.3s',
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {isLive && (
            <>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                display: 'inline-block', animation: 'pulse-live 1.4s ease-in-out infinite', flexShrink: 0,
              }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '1px' }}>EN VIVO</span>
              {minute !== null && (
                <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>
                  {minute}' · {match.currentHalf === 1 ? '1er Tiempo' : '2do Tiempo'}
                </span>
              )}
            </>
          )}
          {isDone && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.8px' }}>FINALIZADO</span>
          )}
          {!isLive && !isDone && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#334155', letterSpacing: '0.5px' }}>PROGRAMADO</span>
          )}
        </div>
        {!isDone && !isLive && (
          <button
            onClick={openVocalia}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: 6, padding: '3px 9px',
              color: '#10b981', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.3px',
            }}
          >
            <ExternalLink size={10} /> Vocalia
          </button>
        )}
      </div>

      {/* Main: teams + score */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 14px', gap: 8 }}>
        {/* Home */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: isDone ? '#64748b' : '#f1f5f9',
              textAlign: 'right', lineHeight: 1.2,
            }}>
              {home?.name ?? '—'}
            </span>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${homeColor}20`, border: `2px solid ${homeColor}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={13} color={homeColor} />
            </div>
          </div>
          {(isLive || isDone) && (homeYellow > 0 || homeRed > 0) && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {homeYellow > 0 && <CardPip color="#eab308" count={homeYellow} />}
              {homeRed > 0 && <CardPip color="#ef4444" count={homeRed} />}
            </div>
          )}
        </div>

        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 84, flexShrink: 0 }}>
          {isDone || isLive ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 34, fontWeight: 900,
              color: isDone ? '#94a3b8' : '#f8fafc',
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', lineHeight: 1,
            }}>
              <span>{match.homeScore}</span>
              <span style={{ fontSize: 22, color: '#2d3748', fontWeight: 600 }}>—</span>
              <span>{match.awayScore}</span>
            </div>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', letterSpacing: '2px' }}>VS</span>
          )}
          {isLive && (
            <div style={{
              marginTop: 6, width: 36, height: 2, borderRadius: 2,
              background: 'linear-gradient(90deg, rgba(16,185,129,0.6), rgba(16,185,129,0.05))',
            }} />
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${awayColor}20`, border: `2px solid ${awayColor}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={13} color={awayColor} />
            </div>
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: isDone ? '#64748b' : '#f1f5f9',
              textAlign: 'left', lineHeight: 1.2,
            }}>
              {away?.name ?? '—'}
            </span>
          </div>
          {(isLive || isDone) && (awayYellow > 0 || awayRed > 0) && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingLeft: 39 }}>
              {awayYellow > 0 && <CardPip color="#eab308" count={awayYellow} />}
              {awayRed > 0 && <CardPip color="#ef4444" count={awayRed} />}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {isLive ? (
        <>
          {/* Event log */}
          {liveEventLog.length > 0 && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '10px 20px',
              background: 'rgba(0,0,0,0.1)',
              display: 'grid',
              gridTemplateColumns: '1fr 36px 1fr',
              rowGap: 5,
              alignItems: 'center',
            }}>
              {liveEventLog.map(event => {
                const isHome = event.teamId === match.homeTeamId;
                const name = getPlayerName(event.playerId);
                return (
                  <Fragment key={event.id}>
                    {/* Home side */}
                    {isHome ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, textAlign: 'right' }}>
                          {name ?? '—'}
                        </span>
                        <EventIcon type={event.eventType} />
                      </div>
                    ) : <div />}
                    {/* Minute */}
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#334155',
                      textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                    }}>
                      {event.minute}'
                    </span>
                    {/* Away side */}
                    {!isHome ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EventIcon type={event.eventType} />
                        <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>
                          {name ?? '—'}
                        </span>
                      </div>
                    ) : <div />}
                  </Fragment>
                );
              })}
            </div>
          )}
          {/* Vocalia CTA */}
          <div style={{
            borderTop: '1px solid rgba(16,185,129,0.1)',
            padding: '8px 16px',
            display: 'flex', justifyContent: 'center',
            background: 'rgba(16,185,129,0.02)',
          }}>
            <button
              onClick={openVocalia}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8, padding: '6px 20px',
                color: '#10b981', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.3px',
              }}
            >
              <ExternalLink size={11} /> Abrir Vocalia
            </button>
          </div>
        </>
      ) : isDone ? (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '8px 16px',
          display: 'flex', justifyContent: 'center', gap: 8,
          background: 'rgba(0,0,0,0.12)',
        }}>
          <button
            onClick={handleDownloadActa}
            disabled={downloadingActa}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 8, padding: '6px 20px',
              color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              opacity: downloadingActa ? 0.6 : 1, transition: 'opacity 0.2s',
            }}
          >
            {downloadingActa
              ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Descargando...</>
              : <><FileDown size={11} /> Descargar Acta</>}
          </button>
          {!roundClosed && (
            <button
              onClick={() => setShowPayment(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8, padding: '6px 16px',
                color: '#a5b4fc', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              💳 Registrar pago
            </button>
          )}
        </div>
      ) : (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '7px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,0.12)',
        }}>
          <Calendar size={11} color="#334155" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: formattedDate ? '#64748b' : '#2d3748', flex: 1 }}>
            {formattedDate ?? 'Sin fecha asignada'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '3px 9px', cursor: 'pointer',
              color: '#475569', fontSize: 11, fontWeight: 600,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
              e.currentTarget.style.color = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <Pencil size={10} /> Editar
          </button>
        </div>
      )}
      <AnimatePresence>
        {showPayment && (
          <PaymentModal
            matchId={match.id}
            homeTeam={home ?? null}
            awayTeam={away ?? null}
            tournament={tournament}
            onClose={() => setShowPayment(false)}
            onSuccess={() => qc.invalidateQueries({ queryKey: ['match-events', match.id] })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <Modal onClose={() => { setEditing(false); setSaveError(null); setDateValue(match.scheduledAt?.slice(0, 16) ?? ''); }}>
            <h2 style={modalTitle}>Programar partido</h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{home?.name ?? '—'}</span>
              <span style={{ color: '#334155', margin: '0 8px' }}>vs</span>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{away?.name ?? '—'}</span>
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); saveSchedule.mutate(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Field label="Fecha y hora">
                <input
                  type="datetime-local"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  autoFocus
                />
              </Field>
              {saveError && (
                <span style={{ fontSize: 12, color: '#f87171', marginTop: -8 }}>{saveError}</span>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => { setEditing(false); setSaveError(null); setDateValue(match.scheduledAt?.slice(0, 16) ?? ''); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveSchedule.isPending}>
                  {saveSchedule.isPending
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : 'Guardar'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Standings Tab ────────────────────────────────────────────────────────────

function StandingsTab({ teams, matches, format }: { teams: Team[]; matches: Match[]; format: string }) {
  if (format !== 'ROUND_ROBIN') {
    return <EmptyState icon={BarChart2} text="La tabla de posiciones solo aplica al formato Round Robin." />;
  }

  const rows = computeStandings(teams, matches);

  if (rows.length === 0) {
    return <EmptyState icon={BarChart2} text="Agregá equipos y generá el fixture para ver la tabla." />;
  }

  const col: React.CSSProperties = { padding: '10px 12px', fontSize: 13, fontVariantNumeric: 'tabular-nums' };
  const hcol: React.CSSProperties = { ...col, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{
      borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.02)', overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <th style={{ ...hcol, width: 32, textAlign: 'center' }}>#</th>
            <th style={{ ...hcol, textAlign: 'left' }}>Equipo</th>
            <th style={{ ...hcol, textAlign: 'center' }}>PJ</th>
            <th style={{ ...hcol, textAlign: 'center' }}>G</th>
            <th style={{ ...hcol, textAlign: 'center' }}>E</th>
            <th style={{ ...hcol, textAlign: 'center' }}>P</th>
            <th style={{ ...hcol, textAlign: 'center' }}>GF</th>
            <th style={{ ...hcol, textAlign: 'center' }}>GC</th>
            <th style={{ ...hcol, textAlign: 'center' }}>DG</th>
            <th style={{ ...hcol, textAlign: 'center', color: '#10b981' }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, played, won, drawn, lost, gf, ga, gd, pts }, i) => (
            <tr
              key={team?.id ?? i}
              style={{
                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i === 0 ? 'rgba(16,185,129,0.04)' : 'transparent',
              }}
            >
              <td style={{ ...col, textAlign: 'center', color: i === 0 ? '#10b981' : '#64748b', fontWeight: 700 }}>{i + 1}</td>
              <td style={{ ...col, color: '#f1f5f9', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamLogo team={team} size={24} />
                  {team?.name ?? '—'}
                </div>
              </td>
              <td style={{ ...col, textAlign: 'center', color: '#94a3b8' }}>{played}</td>
              <td style={{ ...col, textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{won}</td>
              <td style={{ ...col, textAlign: 'center', color: '#94a3b8' }}>{drawn}</td>
              <td style={{ ...col, textAlign: 'center', color: '#ef4444' }}>{lost}</td>
              <td style={{ ...col, textAlign: 'center', color: '#94a3b8' }}>{gf}</td>
              <td style={{ ...col, textAlign: 'center', color: '#94a3b8' }}>{ga}</td>
              <td style={{ ...col, textAlign: 'center', color: gd > 0 ? '#10b981' : gd < 0 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                {gd > 0 ? `+${gd}` : gd}
              </td>
              <td style={{ ...col, textAlign: 'center', color: '#f8fafc', fontWeight: 800, fontSize: 15 }}>{pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Scorers Tab (admin) ──────────────────────────────────────────────────────
function AdminScorersTab({ tournamentId }: { tournamentId: string }) {
  const { data: scorers = [], isLoading } = useQuery({
    queryKey: ['admin', 'scorers', tournamentId],
    queryFn: () => publicApi.getScorersByTournamentId(tournamentId),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 58, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} />
      ))}
    </div>
  );

  if (!scorers.length) return (
    <div style={{
      textAlign: 'center', padding: '60px 24px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
    }}>
      <Swords size={30} color="#1e293b" style={{ marginBottom: 12 }} />
      <p style={{ color: '#475569', fontSize: 14, margin: 0, fontWeight: 500 }}>
        Aún no hay goles registrados en este torneo.
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {scorers.map((row: ScorerRow, i: number) => {
        const isTop = i === 0;
        const medalColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#c2844a' : null;
        return (
          <motion.div
            key={row.player.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              background: isTop ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
              border: isTop ? '1px solid rgba(245,158,11,0.14)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
              {medalColor ? (
                <span style={{ fontSize: 16 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}
                </span>
              )}
            </div>

            {row.player.photoUrl ? (
              <img
                src={row.player.photoUrl} alt={row.player.name}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${row.team.primaryColor ?? '#475569'}55, ${row.team.primaryColor ?? '#475569'}22)`,
                border: `1px solid ${row.team.primaryColor ?? '#475569'}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: row.team.primaryColor ?? '#64748b',
              }}>
                {row.player.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                {row.player.name}
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 600,
                }}>
                  #{row.player.dorsal}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                {row.team.primaryColor && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.team.primaryColor, flexShrink: 0 }} />
                )}
                {row.team.name}
              </div>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: isTop ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
              border: isTop ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '6px 14px', flexShrink: 0,
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: isTop ? '#f59e0b' : '#f1f5f9', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {row.goals}
              </span>
              <span style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 1 }}>GOLES</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Balances Tab ─────────────────────────────────────────────────────────────

const COP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const LEDGER_LABEL: Record<string, string> = {
  MATCH_CHARGE:    'Cobro partido',
  FINE_CHARGE:     'Multa',
  PAYMENT_CREDIT:  'Pago recibido',
  ADJUSTMENT:      'Ajuste',
};

function BalancesTab({ tournamentId, teams }: { tournamentId: string; teams: Team[] }) {
  const [open, setOpen] = useState<string | null>(null);

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['balances', tournamentId],
    queryFn: () => balanceApi.getByTournament(tournamentId),
    staleTime: 30_000,
  });

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  // fill in teams with no balance row yet
  const rows = teams.map((t) => {
    const b = balances.find((b) => b.teamId === t.id);
    return { team: t, balance: b?.balance ?? null };
  }).sort((a, b) => (a.balance ?? 0) - (b.balance ?? 0));

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={20} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(({ team, balance }) => (
        <div key={team.id} style={{
          borderRadius: 14,
          border: balance !== null && balance < 0
            ? '1px solid rgba(239,68,68,0.25)'
            : '1px solid rgba(255,255,255,0.07)',
          background: balance !== null && balance < 0
            ? 'rgba(239,68,68,0.03)'
            : 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setOpen(open === team.id ? null : team.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '14px 18px',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TeamLogo team={team} size={34} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{team.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {balance === null ? (
                <span style={{ fontSize: 12, color: '#334155' }}>Sin movimientos</span>
              ) : balance < 0 ? (
                <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>
                  {COP(balance)}
                </span>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                  {balance === 0 ? 'Al día' : COP(balance)}
                </span>
              )}
              {open === team.id
                ? <ChevronUp size={14} color="#475569" />
                : <ChevronDown size={14} color="#475569" />}
            </div>
          </button>

          <AnimatePresence>
            {open === team.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <LedgerPanel teamId={team.id} tournamentId={tournamentId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function LedgerPanel({ teamId, tournamentId }: { teamId: string; tournamentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['balance-summary', teamId, tournamentId],
    queryFn: () => balanceApi.getTeamSummary(teamId, tournamentId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
        <Loader2 size={14} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const ledger = data?.ledger ?? [];

  if (ledger.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#334155', padding: '12px 18px', margin: 0 }}>Sin movimientos registrados.</p>
    );
  }

  return (
    <div style={{ padding: '8px 18px 14px' }}>
      {ledger.map((entry: LedgerEntry) => {
        const isCredit = entry.amount > 0;
        return (
          <div key={entry.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', margin: 0 }}>
                {LEDGER_LABEL[entry.type] ?? entry.type}
              </p>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>{entry.description}</p>
            </div>
            <span style={{
              fontSize: 13, fontWeight: 800, flexShrink: 0, marginLeft: 12,
              color: isCredit ? '#10b981' : '#ef4444',
            }}>
              {isCredit ? '+' : ''}{COP(entry.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Carnets ──────────────────────────────────────────────────────────────────

const SPORT_LABEL_PRINT: Record<string, string> = { FOOTBALL: 'Fútbol', FUTSAL: 'Fútbol Sala' };

function printCarnets(players: Player[], team: Team, tournament: Tournament) {
  const accent = team.primaryColor ?? '#0d6e6e';
  const sportLabel = SPORT_LABEL_PRINT[tournament.sportType] ?? tournament.sportType;

  const carnetHTML = (player: Player): string => {
    const nameParts = player.name.trim().split(' ');
    const lastName = nameParts.pop() ?? '';
    const firstName = nameParts.join(' ');
    const initials = player.name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);

    const photoHTML = player.photoUrl
      ? `<img src="${player.photoUrl}" style="width:100%;height:100%;object-fit:cover;object-position:top center;display:block;" crossorigin="anonymous">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:26pt;font-weight:900;color:rgba(255,255,255,0.25);">${initials}</div>`;

    const logoHTML = team.logoUrl
      ? `<img src="${team.logoUrl}" style="width:9mm;height:9mm;border-radius:50%;object-fit:cover;border:0.5mm solid rgba(255,255,255,0.5);flex-shrink:0;" crossorigin="anonymous">`
      : `<div style="width:9mm;height:9mm;border-radius:50%;background:rgba(255,255,255,0.15);border:0.5mm solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:4.5pt;font-weight:800;color:white;flex-shrink:0;">${team.name.slice(0, 2).toUpperCase()}</div>`;

    const nameHTML = firstName
      ? `<span style="font-weight:500;letter-spacing:0.1mm;">${firstName.toUpperCase()} </span><span style="font-weight:900;font-style:italic;">${lastName.toUpperCase()}</span>`
      : `<span style="font-weight:900;font-style:italic;">${lastName.toUpperCase()}</span>`;

    return `<div style="width:54mm;height:85.6mm;position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:${accent};break-inside:avoid;page-break-inside:avoid;border-radius:2.5mm;box-shadow:0 1mm 5mm rgba(0,0,0,0.28);">
  <div style="position:absolute;right:-3mm;top:0mm;font-size:115pt;font-weight:900;color:rgba(255,255,255,0.12);line-height:0.85;font-style:italic;pointer-events:none;user-select:none;z-index:0;letter-spacing:-1mm;">${player.dorsal}</div>
  <div style="position:absolute;top:0;left:0;right:0;bottom:18mm;z-index:1;overflow:hidden;">${photoHTML}</div>
  <div style="position:absolute;top:0;left:0;right:0;height:16mm;z-index:2;background:linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,transparent 100%);pointer-events:none;"></div>
  <div style="position:absolute;bottom:18mm;left:0;right:0;height:10mm;z-index:2;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.35) 100%);pointer-events:none;"></div>
  <div style="position:absolute;top:0;left:0;right:0;z-index:3;padding:2.5mm 2.5mm 0;display:flex;align-items:flex-start;justify-content:space-between;">
    <div>
      <div style="font-size:4.5pt;font-weight:800;color:white;text-transform:uppercase;letter-spacing:0.3mm;text-shadow:0 0.3mm 2mm rgba(0,0,0,0.8);max-width:36mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tournament.name}</div>
      <div style="font-size:3.5pt;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.4mm;margin-top:0.3mm;text-shadow:0 0.2mm 1mm rgba(0,0,0,0.7);">${sportLabel}</div>
      <img src="${window.location.origin}/logo.png" style="width:9mm;height:9mm;object-fit:contain;margin-top:1.5mm;display:block;filter:drop-shadow(0 0.3mm 1.5mm rgba(0,0,0,0.5));">
    </div>
    ${logoHTML}
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;z-index:4;">
    <div style="background:rgba(0,0,0,0.78);border-top:0.35mm solid rgba(255,255,255,0.12);padding:2.8mm 3mm 1.5mm;">
      <div style="font-size:8.5pt;color:white;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nameHTML}</div>
    </div>
    <div style="background:rgba(0,0,0,0.60);padding:1.2mm 3mm 2mm;display:flex;align-items:center;gap:2mm;">
      <span style="font-size:5.5pt;font-weight:900;color:white;background:rgba(255,255,255,0.16);padding:0.4mm 2mm;border-radius:0.8mm;letter-spacing:0.1mm;flex-shrink:0;">#${player.dorsal}</span>
      <span style="font-size:5pt;color:rgba(255,255,255,0.8);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase;letter-spacing:0.2mm;flex:1;">${team.name}</span>
      ${(tournament.logoBgRemovedUrl ?? tournament.logoUrl) ? `<img src="${tournament.logoBgRemovedUrl ?? tournament.logoUrl}" style="width:6.5mm;height:6.5mm;object-fit:contain;flex-shrink:0;" crossorigin="anonymous">` : ''}
    </div>
  </div>
</div>`;
  };

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cromos — ${team.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#e2e8f0;font-family:system-ui,sans-serif;}
    @page{size:A4 portrait;margin:10mm;}
    @media print{
      body{background:white;}
      *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
      .no-print{display:none!important;}
    }
    .header{text-align:center;padding:8mm 0 5mm;}
    .header h1{font-size:15pt;color:#0f172a;font-weight:800;}
    .header p{font-size:9pt;color:#64748b;margin-top:1.5mm;}
    .print-btn{display:inline-block;margin-top:4mm;padding:7px 22px;background:${accent};color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.3px;}
    .grid{display:grid;grid-template-columns:repeat(3,54mm);gap:7mm;padding:2mm 0;justify-content:center;}
  </style>
</head>
<body>
  <div class="no-print">
    <div class="header">
      <h1>Cromos — ${team.name}</h1>
      <p>${players.length} jugador${players.length !== 1 ? 'es' : ''} &nbsp;·&nbsp; ${tournament.name}</p>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
    </div>
  </div>
  <div class="grid">
    ${players.map((p) => `<div>${carnetHTML(p)}</div>`).join('\n    ')}
  </div>
  <script>
    window.addEventListener('load', function() { setTimeout(window.print, 400); });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=750');
  if (!win) {
    // eslint-disable-next-line no-alert
    alert('Habilitá las ventanas emergentes del navegador para poder imprimir.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
      color, background: `${color}18`,
    }}>
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{
      padding: '50px 24px', textAlign: 'center',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
    }}>
      <Icon size={30} color="#334155" style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>{text}</p>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '24px 24px 20px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)', position: 'relative',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748b',
        }}>
          <X size={14} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const modalTitle: React.CSSProperties = {
  fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: '0 0 20px', letterSpacing: '-0.3px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '9px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
