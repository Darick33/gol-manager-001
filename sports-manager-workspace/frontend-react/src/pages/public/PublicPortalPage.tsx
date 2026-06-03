import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trophy, Wifi, Clock, ChevronRight } from 'lucide-react';
import { publicApi, type PublicMatch } from '../../api/public.api';
import type { Tournament } from '../../types';

// ── animations ─────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ── helpers ─────────────────────────────────────────────────────────────────
function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TeamLogo({ name, logoUrl, color, size = 44 }: {
  name: string; logoUrl: string | null; color: string | null; size?: number;
}) {
  const c = color ?? '#475569';
  return logoUrl ? (
    <img
      src={logoUrl} alt={name}
      style={{ width: size, height: size, borderRadius: size * 0.25, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25, flexShrink: 0,
      background: `linear-gradient(135deg, ${c}55, ${c}22)`,
      border: `1px solid ${c}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 800, color: c,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── LiveMatchCard ───────────────────────────────────────────────────────────
function LiveMatchCard({ match, index }: { match: PublicMatch; index: number }) {
  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(16,185,129,0.04)',
        border: '1px solid rgba(16,185,129,0.18)',
        borderRadius: 20,
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      {/* live badge + half */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em' }}>EN VIVO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wifi size={12} color="#64748b" />
          <span style={{ fontSize: 11, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
            {formatTimer(match.timerSeconds)} · T{match.currentHalf}
          </span>
        </div>
      </div>

      {/* score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* home */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <TeamLogo name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} color={match.homeTeam.primaryColor} size={40} />
          <span style={{
            fontSize: 14, fontWeight: 700, color: '#f1f5f9',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {match.homeTeam.name}
          </span>
        </div>

        {/* score */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '6px 14px',
          border: '1px solid rgba(16,185,129,0.15)',
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {match.homeScore}
          </span>
          <span style={{ fontSize: 14, color: '#334155', fontWeight: 700 }}>—</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {match.awayScore}
          </span>
        </div>

        {/* away */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: '#f1f5f9',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
          }}>
            {match.awayTeam.name}
          </span>
          <TeamLogo name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} color={match.awayTeam.primaryColor} size={40} />
        </div>
      </div>
    </motion.div>
  );
}

// ── TournamentCard ───────────────────────────────────────────────────────────
const FORMAT_SHORT: Record<string, string> = {
  ROUND_ROBIN: 'Round Robin',
  DIRECT_ELIMINATION: 'Eliminación',
  GROUPS_ELIMINATION: 'Grupos + Elim.',
};

function TournamentCard({ tournament, index }: { tournament: Tournament; index: number }) {
  const navigate = useNavigate();
  const isActive = tournament.status === 'ACTIVE';

  return (
    <motion.button
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      onClick={() => navigate(`/portal/${tournament.slug}`)}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: isActive
          ? 'linear-gradient(140deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.02) 100%)'
          : 'rgba(255,255,255,0.02)',
        border: isActive ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer', width: '100%', textAlign: 'left',
        boxShadow: isActive ? '0 4px 32px rgba(16,185,129,0.06)' : 'none',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* logo / trophy */}
      <div style={{
        width: 56, height: 56, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
        background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
        border: isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {tournament.logoUrl ? (
          <img
            src={tournament.logoUrl} alt={tournament.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
          />
        ) : (
          <Trophy size={22} color={isActive ? '#10b981' : '#475569'} />
        )}
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 7, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tournament.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.04em',
            background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            color: isActive ? '#10b981' : '#475569',
            border: isActive ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.08)',
          }}>
            {isActive ? 'ACTIVO' : 'FINALIZADO'}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#2d3748', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
            {tournament.sportType === 'FOOTBALL' ? 'Fútbol' : 'Fútbol Sala'}
          </span>
          {tournament.category && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#2d3748', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{tournament.category}</span>
            </>
          )}
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#2d3748', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{FORMAT_SHORT[tournament.format] ?? tournament.format}</span>
        </div>
      </div>

      <ChevronRight size={16} color={isActive ? '#10b981' : '#334155'} style={{ flexShrink: 0 }} />
    </motion.button>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────
export default function PublicPortalPage() {
  const { data: liveMatches = [], isLoading: loadingLive } = useQuery({
    queryKey: ['public', 'live'],
    queryFn: publicApi.getLiveMatches,
    refetchInterval: 10_000,
  });

  const { data: tournaments = [], isLoading: loadingTournaments } = useQuery({
    queryKey: ['public', 'tournaments'],
    queryFn: publicApi.getTournaments,
  });

  const hasLive = liveMatches.length > 0;

  // group live matches by tournament
  const activeTournaments = useMemo(
    () => tournaments.filter((t) => t.status === 'ACTIVE'),
    [tournaments],
  );
  const otherTournaments = useMemo(
    () => tournaments.filter((t) => t.status !== 'ACTIVE'),
    [tournaments],
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #050508 0%, #0a0f1a 50%, #050508 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── header ── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,5,8,0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: 720, margin: '0 auto',
          height: 60, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16,185,129,0.35)',
          }}>
            <Trophy size={16} color="white" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            Gol<span style={{ color: '#10b981' }}>Manager</span>
          </span>
          {hasLive && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                {liveMatches.length} en vivo
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── live section ── */}
        {(hasLive || loadingLive) && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}
              />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' }}>
                Partidos en vivo
              </h2>
            </div>
            {loadingLive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1].map((i) => (
                  <div key={i} style={{
                    height: 120, borderRadius: 20, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {liveMatches.map((m, i) => (
                  <LiveMatchCard key={m.id} match={m} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── tournaments ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
          >
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: '0 0 5px', letterSpacing: '-0.5px' }}>
                Torneos
              </h1>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                {activeTournaments.length > 0
                  ? `${activeTournaments.length} activo${activeTournaments.length !== 1 ? 's' : ''} ahora`
                  : 'Sin torneos activos'}
              </p>
            </div>
            {!loadingTournaments && tournaments.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#334155',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '3px 10px',
              }}>
                {tournaments.length} total
              </span>
            )}
          </motion.div>

          {loadingTournaments ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ height: 92, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }}>
              <Trophy size={32} color="#1e293b" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: '#475569', fontSize: 14, fontWeight: 500 }}>No hay torneos disponibles por ahora.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeTournaments.map((t, i) => (
                <TournamentCard key={t.id} tournament={t} index={i} />
              ))}

              {otherTournaments.length > 0 && (
                <>
                  {activeTournaments.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 4px' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#2d3748', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                        Finalizados
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  )}
                  {otherTournaments.map((t, i) => (
                    <TournamentCard key={t.id} tournament={t} index={activeTournaments.length + i} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>
            Powered by <span style={{ color: '#10b981' }}>GolManager</span>
          </span>
        </div>
      </div>
    </div>
  );
}
