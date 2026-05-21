import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Radio, Calendar, FileDown, ExternalLink,
  Trophy, Swords, Loader2,
} from 'lucide-react';
import { tournamentsApi } from '../../api/tournaments.api';
import { teamsApi } from '../../api/teams.api';
import { matchesApi } from '../../api/matches.api';
import type { Match, Team, MatchStatus } from '../../types';

// ── animation ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ── constants ──────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<MatchStatus, { label: string; color: string; bg: string }> = {
  SCHEDULED:   { label: 'Programado', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  IN_PROGRESS: { label: 'En curso',   color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  FINISHED:    { label: 'Finalizado', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
};

const STATUS_FILTERS: Array<{ value: 'ALL' | MatchStatus; label: string }> = [
  { value: 'ALL',         label: 'Todos'      },
  { value: 'SCHEDULED',   label: 'Programados' },
  { value: 'IN_PROGRESS', label: 'En curso'   },
  { value: 'FINISHED',    label: 'Finalizados' },
];

// ── helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return 'Sin programar';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  );
}

function resolveColor(match: Match, side: 'home' | 'away', team?: Team): string {
  const override = side === 'home' ? match.homeTeamColor : match.awayTeamColor;
  return override ?? team?.primaryColor ?? '#475569';
}

// ── MatchCard ──────────────────────────────────────────────────────────────
function MatchCard({ match, homeTeam, awayTeam, index }: {
  match: Match; homeTeam?: Team; awayTeam?: Team; index: number;
}) {
  const [downloading, setDownloading] = useState(false);

  const badge     = STATUS_BADGE[match.status];
  const isLive     = match.status === 'IN_PROGRESS';
  const isFinished = match.status === 'FINISHED';
  const homeColor  = resolveColor(match, 'home', homeTeam);
  const awayColor  = resolveColor(match, 'away', awayTeam);

  async function handleDownloadActa() {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await matchesApi.getActa(match.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `acta-${match.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function handleOpenVocalia() {
    window.open(`/admin/vocalia/${match.id}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: isLive
          ? '1px solid rgba(16,185,129,0.28)'
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* live ambient glow */}
      {isLive && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 200, height: 150, pointerEvents: 'none',
          background: 'radial-gradient(circle at top right, rgba(16,185,129,0.09) 0%, transparent 70%)',
        }} />
      )}

      {/* ── row 1: badge + phase ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 20,
          background: badge.bg, border: `1px solid ${badge.color}25`,
        }}>
          {isLive && (
            <motion.div
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: badge.color, flexShrink: 0 }}
            />
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, letterSpacing: '0.2px' }}>
            {badge.label}
          </span>
        </div>

        {(match.phase || match.stage != null) && (
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>
            {[match.phase, match.stage != null ? `Fecha ${match.stage}` : null]
              .filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {/* ── row 2: teams + score ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 18, fontVariantNumeric: 'tabular-nums',
      }}>
        {/* home team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: homeColor, boxShadow: `0 0 7px ${homeColor}90`,
          }} />
          {homeTeam?.logoUrl && (
            <img
              src={homeTeam.logoUrl} alt={homeTeam.name}
              width={22} height={22}
              style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <span style={{
            fontSize: 14, fontWeight: 600, color: '#e2e8f0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {homeTeam?.name ?? '—'}
          </span>
        </div>

        {/* score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {isFinished || isLive ? (
            <>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', minWidth: 22, textAlign: 'right' }}>
                {match.homeScore}
              </span>
              <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 700, padding: '0 2px' }}>:</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', minWidth: 22, textAlign: 'left' }}>
                {match.awayScore}
              </span>
            </>
          ) : (
            <Swords size={15} color="#1e293b" />
          )}
        </div>

        {/* away team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 14, fontWeight: 600, color: '#e2e8f0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
          }}>
            {awayTeam?.name ?? '—'}
          </span>
          {awayTeam?.logoUrl && (
            <img
              src={awayTeam.logoUrl} alt={awayTeam.name}
              width={22} height={22}
              style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: awayColor, boxShadow: `0 0 7px ${awayColor}90`,
          }} />
        </div>
      </div>

      {/* ── row 3: date + CTA ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          <Calendar size={12} color="#334155" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: 12, color: '#475569', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {formatDate(match.scheduledAt)}
          </span>
        </div>

        {isFinished ? (
          match.actaPdfUrl ? (
            <button
              onClick={handleDownloadActa}
              disabled={downloading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '0 14px', height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)',
                color: downloading ? '#64748b' : '#8b5cf6',
                fontSize: 12, fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease', opacity: downloading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
            >
              {downloading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={13} />}
              Acta
            </button>
          ) : null
        ) : (
          <button
            onClick={handleOpenVocalia}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 14px', height: 44, borderRadius: 10, flexShrink: 0,
              background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${isLive ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.18)'}`,
              color: '#10b981', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isLive ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)'; }}
          >
            <Radio size={13} />
            {isLive ? 'Continuar' : 'Vocalía'}
            <ExternalLink size={11} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── skeleton ───────────────────────────────────────────────────────────────
function MatchSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18, padding: '20px 22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ width: 82, height: 22, borderRadius: 20, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ width: 56, height: 16, borderRadius: 4,  background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ width: 40, height: 26, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ flex: 1, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: 110, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ width: 84,  height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </motion.div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsApi.list,
  });

  // rerender-derived-state: auto-select first active tournament without useEffect
  const activeTournamentId =
    selectedTournamentId ??
    tournaments.find((t) => t.status === 'ACTIVE')?.id ??
    tournaments[0]?.id ??
    null;

  const enabled = !!activeTournamentId;

  // async-parallel: both queries fire at the same time
  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ['matches', 'tournament', activeTournamentId],
    queryFn: () => tournamentsApi.getMatches(activeTournamentId!),
    enabled,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', 'tournament', activeTournamentId],
    queryFn: () => teamsApi.getByTournament(activeTournamentId!),
    enabled,
  });

  // js-index-maps: O(1) team lookup
  const teamMap = useMemo<Record<string, Team>>(() => {
    if (!teams?.length) return {};
    return Object.fromEntries(teams.map((t) => [t.id, t]));
  }, [teams]);

  // rerender-derived-state: all derived in render, no useEffect
  const stats = useMemo(() => ({
    total:      matches?.length        ?? 0,
    scheduled:  matches?.filter((m) => m.status === 'SCHEDULED').length   ?? 0,
    inProgress: matches?.filter((m) => m.status === 'IN_PROGRESS').length ?? 0,
    finished:   matches?.filter((m) => m.status === 'FINISHED').length    ?? 0,
  }), [matches]);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (statusFilter === 'ALL') return matches;
    return matches.filter((m) => m.status === statusFilter);
  }, [matches, statusFilter]);

  const statsStrip = [
    { label: 'Total',       value: stats.total,      color: '#f8fafc' },
    { label: 'Programados', value: stats.scheduled,  color: '#64748b' },
    { label: 'En curso',    value: stats.inProgress, color: '#10b981' },
    { label: 'Finalizados', value: stats.finished,   color: '#8b5cf6' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        style={{ marginBottom: 26 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radio size={16} color="#10b981" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>
            Partidos
          </h1>
          {stats.inProgress > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
            }}>
              <motion.div
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                {stats.inProgress} en vivo
              </span>
            </div>
          )}
        </div>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
          Gestioná los partidos y accedé a la vocalía digital.
        </p>
      </motion.div>

      {/* ── tournament tabs ── */}
      {tournaments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 4, marginBottom: 18,
            scrollbarWidth: 'none',
          }}
        >
          {tournaments.map((t) => {
            const isActive = t.id === activeTournamentId;
            return (
              <button
                key={t.id}
                onClick={() => { setSelectedTournamentId(t.id); setStatusFilter('ALL'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0 16px', height: 44, borderRadius: 10, flexShrink: 0,
                  background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? '#10b981' : '#64748b',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trophy size={13} />
                {t.name}
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                  background: t.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                  color: t.status === 'ACTIVE' ? '#10b981' : '#475569',
                }}>
                  {t.status === 'ACTIVE' ? 'ACTIVO' : t.status === 'FINISHED' ? 'FIN' : 'DRAFT'}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* ── stats strip ── */}
      {activeTournamentId && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10, marginBottom: 18,
          }}
        >
          {statsStrip.map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '12px 16px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.5px' }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── status filter ── */}
      {activeTournamentId && !loadingMatches && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.12 }}
          style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}
        >
          {STATUS_FILTERS.map(({ value, label }) => {
            const count =
              value === 'SCHEDULED'   ? stats.scheduled  :
              value === 'IN_PROGRESS' ? stats.inProgress :
              value === 'FINISHED'    ? stats.finished   : null;
            const isActive = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', height: 36, borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.14)' : '1px solid transparent',
                  color: isActive ? '#f1f5f9' : '#475569',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
                {count != null && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: isActive ? '#64748b' : '#334155',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* ── content ── */}
      {!activeTournamentId ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          color: '#475569', fontSize: 14,
        }}>
          <Trophy size={36} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 500 }}>Seleccioná un torneo para ver sus partidos.</p>
        </div>
      ) : loadingMatches ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <MatchSkeleton key={i} index={i} />)}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '70px 24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18,
        }}>
          <Radio size={34} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: 14 }}>
            No hay partidos{statusFilter !== 'ALL' ? ' en esta categoría' : ''}.
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#334155' }}>
            {statusFilter !== 'ALL'
              ? 'Probá con otro filtro.'
              : 'Generá el fixture desde el detalle del torneo.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filteredMatches.map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              homeTeam={teamMap[match.homeTeamId]}
              awayTeam={teamMap[match.awayTeamId]}
              index={i}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
