import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, Trophy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tournamentsApi } from '../../api/tournaments.api';
import { teamsApi } from '../../api/teams.api';
import type { Team } from '../../types';

// ── animation ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ── TeamCard ───────────────────────────────────────────────────────────────
function TeamCard({ team, tournamentId, index }: {
  team: Team; tournamentId: string; index: number;
}) {
  const primary   = team.primaryColor   ?? '#475569';
  const secondary = team.secondaryColor ?? '#334155';
  const initials  = team.name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      {/* logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            width={48} height={48}
            style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
          />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${primary}55, ${primary}22)`,
            border: `1px solid ${primary}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 800, color: primary, letterSpacing: '-0.5px',
          }}>
            {initials}
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: '#f1f5f9',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {team.name}
          </div>
          {/* color swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: primary,
              boxShadow: `0 0 6px ${primary}70`,
              border: '1px solid rgba(255,255,255,0.12)',
            }} title="Color principal" />
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: secondary,
              boxShadow: `0 0 6px ${secondary}60`,
              border: '1px solid rgba(255,255,255,0.10)',
            }} title="Color secundario" />
            <span style={{ fontSize: 11, color: '#334155', marginLeft: 2 }}>
              {primary} · {secondary}
            </span>
          </div>
        </div>
      </div>

      {/* manage link */}
      <Link
        to={`/admin/tournaments/${tournamentId}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '0 14px', height: 40, borderRadius: 10,
          background: 'rgba(16,185,129,0.07)',
          border: '1px solid rgba(16,185,129,0.16)',
          color: '#10b981', fontSize: 12, fontWeight: 600,
          textDecoration: 'none', transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.07)'; }}
      >
        Gestionar equipo
        <ExternalLink size={11} />
      </Link>
    </motion.div>
  );
}

// ── skeleton ───────────────────────────────────────────────────────────────
function TeamSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 16, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ height: 12, width: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      <div style={{ height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
    </motion.div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsApi.list,
  });

  // auto-select first active tournament — derived state, no useEffect
  const activeTournamentId =
    selectedTournamentId ??
    tournaments.find((t) => t.status === 'ACTIVE')?.id ??
    tournaments[0]?.id ??
    null;

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', 'tournament', activeTournamentId],
    queryFn: () => teamsApi.getByTournament(activeTournamentId!),
    enabled: !!activeTournamentId,
  });

  // js-index-maps: O(1) tournament lookup
  const tournamentMap = useMemo(
    () => Object.fromEntries(tournaments.map((t) => [t.id, t])),
    [tournaments],
  );

  const currentTournament = activeTournamentId ? tournamentMap[activeTournamentId] : null;

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
            <Users size={16} color="#10b981" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>
            Equipos
          </h1>
          {teams && teams.length > 0 && (
            <div style={{
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
              </span>
            </div>
          )}
        </div>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
          Vista general de equipos por torneo. La gestión de plantilla está en el detalle del torneo.
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
            paddingBottom: 4, marginBottom: 24,
            scrollbarWidth: 'none',
          }}
        >
          {tournaments.map((t) => {
            const isActive = t.id === activeTournamentId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTournamentId(t.id)}
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

      {/* ── manage-from-detail hint ── */}
      {currentTournament && !isLoading && teams && teams.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
          }}
        >
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Para agregar equipos o gestionar plantillas, andá al detalle del torneo.
          </span>
          <Link
            to={`/admin/tournaments/${currentTournament.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8, flexShrink: 0,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981', fontSize: 12, fontWeight: 600,
              textDecoration: 'none', transition: 'background 0.15s ease',
            }}
          >
            Ir al torneo
            <ExternalLink size={11} />
          </Link>
        </motion.div>
      )}

      {/* ── content ── */}
      {!activeTournamentId ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Trophy size={36} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 500, color: '#64748b', fontSize: 14 }}>
            Seleccioná un torneo para ver sus equipos.
          </p>
        </div>
      ) : isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <TeamSkeleton key={i} index={i} />)}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '70px 24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18,
        }}>
          <Users size={34} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: 14 }}>
            No hay equipos en este torneo todavía.
          </p>
          <Link
            to={`/admin/tournaments/${activeTournamentId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 14, padding: '8px 16px', borderRadius: 10,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Agregar equipos
            <ExternalLink size={12} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {teams.map((team, i) => (
            <TeamCard
              key={team.id}
              team={team}
              tournamentId={activeTournamentId}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
