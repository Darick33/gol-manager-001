import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Trophy, CheckCircle2, ChevronDown } from 'lucide-react';
import { tournamentsApi } from '../../api/tournaments.api';
import { teamsApi } from '../../api/teams.api';
import { finesApi } from '../../api/fines.api';
import type { Fine, FineStatus, Team } from '../../types';

// ── constants ──────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<FineStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PAID:    { label: 'Pagada',    color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const STATUS_FILTERS: Array<{ value: 'ALL' | FineStatus; label: string }> = [
  { value: 'ALL',     label: 'Todas'      },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'PAID',    label: 'Pagadas'    },
];

// ── helpers ────────────────────────────────────────────────────────────────
function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short',
  });
}

// ── TeamAvatar ─────────────────────────────────────────────────────────────
function TeamAvatar({ team, size = 36 }: { team: Team; size?: number }) {
  const primary = team.primaryColor ?? '#475569';
  const [imgError, setImgError] = useState(false);

  return team.logoUrl && !imgError ? (
    <img
      src={team.logoUrl} alt={team.name}
      onError={() => setImgError(true)}
      style={{ width: size, height: size, borderRadius: size * 0.28, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: `linear-gradient(135deg, ${primary}55, ${primary}22)`,
      border: `1px solid ${primary}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: primary,
    }}>
      {team.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── FineRow — individual fine inside accordion ─────────────────────────────
function FineRow({ fine, index }: { fine: Fine; index: number }) {
  const badge = STATUS_BADGE[fine.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* reason + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#cbd5e1',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {fine.reason}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
          {formatDate(fine.createdAt)}
        </div>
      </div>

      {/* half */}
      {fine.half > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#475569',
          padding: '2px 7px', borderRadius: 4,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          T{fine.half}
        </span>
      )}

      {/* amount */}
      <span style={{
        fontSize: 14, fontWeight: 800,
        color: fine.status === 'PAID' ? '#10b981' : '#f59e0b',
        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
      }}>
        {formatCOP(fine.amount)}
      </span>

      {/* status */}
      <div style={{
        padding: '3px 9px', borderRadius: 20, flexShrink: 0,
        background: badge.bg, border: `1px solid ${badge.color}25`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: badge.color }}>
          {badge.label}
        </span>
      </div>
    </motion.div>
  );
}

// ── TeamFinesRow — accordion row ───────────────────────────────────────────
interface TeamGroup {
  team: Team;
  fines: Fine[];
  pendingSum: number;
  paidSum: number;
  pendingCount: number;
}

function TeamFinesRow({ group, index }: { group: TeamGroup; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        borderRadius: 16,
        border: group.pendingCount > 0
          ? '1px solid rgba(245,158,11,0.16)'
          : '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.025)',
        overflow: 'hidden',
      }}
    >
      {/* ── header row ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <TeamAvatar team={group.team} size={40} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
            {group.team.name}
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
            {group.fines.length} multa{group.fines.length !== 1 ? 's' : ''}
            {group.pendingCount > 0 && (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                {' '}· {group.pendingCount} pendiente{group.pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* amounts */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          {group.pendingSum > 0 && (
            <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
              {formatCOP(group.pendingSum)}
            </span>
          )}
          {group.paidSum > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
              {formatCOP(group.paidSum)} cobrado
            </span>
          )}
        </div>

        <ChevronDown
          size={16} color="#475569"
          style={{
            flexShrink: 0, transition: 'transform 0.22s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* ── expanded fines ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '12px 16px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {group.fines.map((fine, i) => (
                <FineRow key={fine.id} fine={fine} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── skeleton ───────────────────────────────────────────────────────────────
function TeamSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      style={{
        borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: 120, height: 15, borderRadius: 4, background: 'rgba(255,255,255,0.07)', marginBottom: 7 }} />
        <div style={{ width: 80, height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div style={{ width: 70, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
    </motion.div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function FinesPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | FineStatus>('ALL');

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsApi.list,
  });

  const activeTournamentId =
    selectedTournamentId ??
    tournaments.find((t) => t.status === 'ACTIVE')?.id ??
    tournaments[0]?.id ??
    null;

  const enabled = !!activeTournamentId;

  // async-parallel: both queries fire simultaneously
  const { data: fines, isLoading } = useQuery({
    queryKey: ['fines', 'tournament', activeTournamentId],
    queryFn: () => finesApi.listByTournament(activeTournamentId!),
    enabled,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', 'tournament', activeTournamentId],
    queryFn: () => teamsApi.getByTournament(activeTournamentId!),
    enabled,
  });

  // rerender-derived-state: compute everything in render
  const teamGroups = useMemo<TeamGroup[]>(() => {
    if (!teams?.length || !fines?.length) return [];

    // js-index-maps
    const finesByTeam = new Map<string, Fine[]>();
    for (const fine of fines) {
      if (statusFilter !== 'ALL' && fine.status !== statusFilter) continue;
      const list = finesByTeam.get(fine.teamId) ?? [];
      list.push(fine);
      finesByTeam.set(fine.teamId, list);
    }

    return teams
      .filter((t) => finesByTeam.has(t.id))
      .map((team) => {
        const teamFines = finesByTeam.get(team.id)!;
        return {
          team,
          fines: teamFines,
          pendingSum:   teamFines.filter((f) => f.status === 'PENDING').reduce((s, f) => s + f.amount, 0),
          paidSum:      teamFines.filter((f) => f.status === 'PAID').reduce((s, f) => s + f.amount, 0),
          pendingCount: teamFines.filter((f) => f.status === 'PENDING').length,
        };
      })
      .sort((a, b) => b.pendingSum - a.pendingSum || b.fines.length - a.fines.length);
  }, [fines, teams, statusFilter]);

  const stats = useMemo(() => {
    if (!fines?.length) return { total: 0, pendingCount: 0, pendingSum: 0, paidSum: 0 };
    return {
      total:        fines.length,
      pendingCount: fines.filter((f) => f.status === 'PENDING').length,
      pendingSum:   fines.filter((f) => f.status === 'PENDING').reduce((s, f) => s + f.amount, 0),
      paidSum:      fines.filter((f) => f.status === 'PAID').reduce((s, f) => s + f.amount, 0),
    };
  }, [fines]);

  const isEmpty = !isLoading && activeTournamentId && teamGroups.length === 0;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>

      {/* ── header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }} style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={16} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>
            Multas
          </h1>
          {stats.pendingCount > 0 && (
            <div style={{
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                {stats.pendingCount} pendiente{stats.pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
          Deudas generadas por tarjetas, atrasos y otros eventos del torneo.
        </p>
      </motion.div>

      {/* ── tournament tabs ── */}
      {tournaments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18, scrollbarWidth: 'none' }}>
          {tournaments.map((t) => {
            const isActive = t.id === activeTournamentId;
            return (
              <button key={t.id}
                onClick={() => { setSelectedTournamentId(t.id); setStatusFilter('ALL'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0 16px', height: 44, borderRadius: 10, flexShrink: 0,
                  background: isActive ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? '#f59e0b' : '#64748b',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
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
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Total multas',    value: stats.total,                 color: '#f8fafc' },
            { label: 'Deuda pendiente', value: formatCOP(stats.pendingSum), color: '#f59e0b' },
            { label: 'Total cobrado',   value: formatCOP(stats.paidSum),    color: '#10b981' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── status filter ── */}
      {activeTournamentId && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.12 }}
          style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(({ value, label }) => {
            const active = statusFilter === value;
            return (
              <button key={value} onClick={() => setStatusFilter(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', height: 36, borderRadius: 8,
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(255,255,255,0.14)' : '1px solid transparent',
                  color: active ? '#f1f5f9' : '#475569',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                {label}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* ── content ── */}
      {!activeTournamentId ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Trophy size={36} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 500, color: '#64748b', fontSize: 14 }}>
            Seleccioná un torneo para ver las multas.
          </p>
        </div>
      ) : isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <TeamSkeleton key={i} index={i} />)}
        </div>
      ) : isEmpty ? (
        <div style={{
          textAlign: 'center', padding: '70px 24px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18,
        }}>
          <CheckCircle2 size={34} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: 14 }}>
            {statusFilter !== 'ALL' ? 'No hay multas en esta categoría.' : 'No hay multas registradas en este torneo.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {teamGroups.map((group, i) => (
            <TeamFinesRow key={group.team.id} group={group} index={i} />
          ))}
        </div>
      )}

    </div>
  );
}
