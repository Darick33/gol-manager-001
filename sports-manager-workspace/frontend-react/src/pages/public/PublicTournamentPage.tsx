import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Calendar, FileText, Swords, Users } from 'lucide-react';
import { publicApi, type PublicMatch, type StandingRow, type ScorerRow, type PublicTournament } from '../../api/public.api';

// ── animations ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.34, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ── helpers ──────────────────────────────────────────────────────────────────
function formatTimer(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' }),
    time: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  };
}

function TeamLogo({ name, logoUrl, color, size = 38 }: {
  name: string; logoUrl: string | null; color: string | null; size?: number;
}) {
  const c = color ?? '#475569';
  return logoUrl ? (
    <img
      src={logoUrl} alt={name}
      style={{ width: size, height: size, borderRadius: size * 0.26, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26, flexShrink: 0,
      background: `linear-gradient(135deg, ${c}55, ${c}22)`,
      border: `1px solid ${c}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: c,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── MatchRow ─────────────────────────────────────────────────────────────────
function MatchRow({ match, index }: { match: PublicMatch; index: number }) {
  const isLive = match.status === 'IN_PROGRESS';
  const isFinished = match.status === 'FINISHED';
  const dateInfo = formatDate(match.scheduledAt);

  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: isLive ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
        border: isLive ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: 14, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ width: 64, flexShrink: 0, textAlign: 'center' }}>
        {isLive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>
              {formatTimer(match.timerSeconds)}'
            </span>
            <span style={{ fontSize: 9, color: '#10b981', opacity: 0.7 }}>T{match.currentHalf}</span>
          </div>
        ) : dateInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{dateInfo.day}</span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{dateInfo.time}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Calendar size={14} color="#334155" />
            <span style={{ fontSize: 9, color: '#334155' }}>Sin fecha</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: 13, fontWeight: isFinished || isLive ? 700 : 500,
          color: isFinished && match.homeScore > match.awayScore ? '#f1f5f9' : '#94a3b8',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
        }}>
          {match.homeTeam.name}
        </span>
        <TeamLogo name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} color={match.homeTeam.primaryColor} size={34} />
      </div>

      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '5px 12px',
        border: isLive ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.05)',
        minWidth: 60, justifyContent: 'center',
      }}>
        {isFinished || isLive ? (
          <>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>{match.homeScore}</span>
            <span style={{ fontSize: 12, color: '#334155' }}>-</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>{match.awayScore}</span>
          </>
        ) : (
          <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>vs</span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <TeamLogo name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} color={match.awayTeam.primaryColor} size={34} />
        <span style={{
          fontSize: 13, fontWeight: isFinished || isLive ? 700 : 500,
          color: isFinished && match.awayScore > match.homeScore ? '#f1f5f9' : '#94a3b8',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {match.awayTeam.name}
        </span>
      </div>

      {match.actaPdfUrl && (
        <a
          href={match.actaPdfUrl} target="_blank" rel="noopener noreferrer" title="Descargar acta"
          style={{ flexShrink: 0, color: '#334155', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#10b981'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#334155'; }}
        >
          <FileText size={15} />
        </a>
      )}
    </motion.div>
  );
}

// ── Fixture tab ──────────────────────────────────────────────────────────────
function FixtureTab({ slug }: { slug: string }) {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['public', 'matches', slug],
    queryFn: () => publicApi.getMatches(slug),
    refetchInterval: 15_000,
  });

  const grouped = (() => {
    const map = new Map<number | string, PublicMatch[]>();
    for (const m of matches) {
      const key = m.stage ?? 'Sin jornada';
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return 0;
    });
  })();

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ height: 66, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} />
      ))}
    </div>
  );

  if (!matches.length) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <Calendar size={30} color="#1e293b" style={{ marginBottom: 12 }} />
      <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>No hay partidos programados aún.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {grouped.map(([stage, stageMatches]) => (
        <div key={String(stage)}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
            {typeof stage === 'number' ? `Jornada ${stage}` : String(stage)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stageMatches.map((m, i) => <MatchRow key={m.id} match={m} index={i} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Standings tab ────────────────────────────────────────────────────────────
function StandingsTab({ slug }: { slug: string }) {
  const { data: standings = [], isLoading } = useQuery({
    queryKey: ['public', 'standings', slug],
    queryFn: () => publicApi.getStandings(slug),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} />
      ))}
    </div>
  );

  if (!standings.length) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <Trophy size={30} color="#1e293b" style={{ marginBottom: 12 }} />
      <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>La tabla se generará cuando haya partidos finalizados.</p>
    </div>
  );

  const colStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', textAlign: 'center' as const };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 36px 36px 36px 36px 44px 44px 44px 44px', gap: 4, padding: '8px 12px', marginBottom: 4 }}>
        <span style={colStyle}>#</span>
        <span style={{ ...colStyle, textAlign: 'left' }}>Equipo</span>
        <span style={colStyle}>PJ</span>
        <span style={colStyle}>G</span>
        <span style={colStyle}>E</span>
        <span style={colStyle}>P</span>
        <span style={colStyle}>GF</span>
        <span style={colStyle}>GC</span>
        <span style={colStyle}>DG</span>
        <span style={{ ...colStyle, color: '#10b981' }}>PTS</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {standings.map((row: StandingRow, i: number) => (
          <StandingRowItem key={row.team.id} row={row} position={i + 1} index={i} />
        ))}
      </div>
    </div>
  );
}

function StandingRowItem({ row, position, index }: { row: StandingRow; position: number; index: number }) {
  const isTop3 = position <= 3;
  const posColor = position === 1 ? '#f59e0b' : position === 2 ? '#94a3b8' : position === 3 ? '#c2844a' : '#334155';

  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        display: 'grid', gridTemplateColumns: '28px 1fr 36px 36px 36px 36px 44px 44px 44px 44px',
        gap: 4, padding: '10px 12px', borderRadius: 10,
        background: isTop3 ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.02)',
        border: isTop3 ? '1px solid rgba(16,185,129,0.09)' : '1px solid rgba(255,255,255,0.04)',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: posColor, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{position}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {row.team.primaryColor && (
          <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: row.team.primaryColor, boxShadow: `0 0 5px ${row.team.primaryColor}60` }} />
        )}
        {row.team.logoUrl && <img src={row.team.logoUrl} alt={row.team.name} style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team.name}</span>
      </div>
      {[row.played, row.won, row.drawn, row.lost, row.goalsFor, row.goalsAgainst].map((v, i) => (
        <span key={i} style={{ fontSize: 13, color: '#64748b', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
      ))}
      <span style={{ fontSize: 13, textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: row.goalDifference > 0 ? '#10b981' : row.goalDifference < 0 ? '#f87171' : '#64748b', fontWeight: 600 }}>
        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
      </span>
      <span style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.points}</span>
    </motion.div>
  );
}

// ── Scorers tab ──────────────────────────────────────────────────────────────
function ScorersTab({ slug }: { slug: string }) {
  const { data: scorers = [], isLoading } = useQuery({
    queryKey: ['public', 'scorers', slug],
    queryFn: () => publicApi.getScorers(slug),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 58, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} />
      ))}
    </div>
  );

  if (!scorers.length) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <Swords size={30} color="#1e293b" style={{ marginBottom: 12 }} />
      <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Aún no hay goles registrados.</p>
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
            custom={i} variants={fadeUp} initial="hidden" animate="visible"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              background: isTop ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
              border: isTop ? '1px solid rgba(245,158,11,0.14)' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
              {medalColor ? (
                <span style={{ fontSize: 16 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              )}
            </div>
            {row.player.photoUrl ? (
              <img src={row.player.photoUrl} alt={row.player.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${row.team.primaryColor ?? '#475569'}55, ${row.team.primaryColor ?? '#475569'}22)`,
                border: `1px solid ${row.team.primaryColor ?? '#475569'}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: row.team.primaryColor ?? '#64748b',
              }}>
                {row.player.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                {row.player.name}
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 600 }}>
                  #{row.player.dorsal}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                {row.team.primaryColor && <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.team.primaryColor, flexShrink: 0 }} />}
                {row.team.name}
              </div>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: isTop ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
              border: isTop ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '6px 12px', flexShrink: 0,
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: isTop ? '#f59e0b' : '#f1f5f9', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{row.goals}</span>
              <span style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 1 }}>GOLES</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Teams Tab ────────────────────────────────────────────────────────────────
function TeamsTab({ slug, tournament }: { slug: string; tournament: PublicTournament }) {
  const navigate = useNavigate();
  const teams = tournament.teams;

  if (!teams.length) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <Users size={30} color="#1e293b" style={{ marginBottom: 12 }} />
      <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>No hay equipos inscritos aún.</p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10 }}>
      {teams.map((team, i) => {
        const accent = team.primaryColor ?? '#475569';
        return (
          <motion.button
            key={team.id}
            custom={i} variants={fadeUp} initial="hidden" animate="visible"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/portal/${slug}/equipos/${team.id}`, { state: { team, slug } })}
            style={{
              background: `linear-gradient(150deg, ${accent}14 0%, rgba(255,255,255,0.015) 100%)`,
              border: `1px solid ${accent}28`,
              borderRadius: 16, padding: '22px 14px 18px',
              cursor: 'pointer', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            <TeamLogo name={team.name} logoUrl={team.logoUrl} color={team.primaryColor} size={60} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3, textAlign: 'center' }}>
              {team.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────
type Tab = 'fixture' | 'standings' | 'scorers' | 'teams';

export default function PublicTournamentPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('fixture');

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['public', 'tournament', slug],
    queryFn: () => publicApi.getTournament(slug!),
    enabled: !!slug,
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'fixture', label: 'Fixture' },
    { id: 'standings', label: 'Tabla' },
    { id: 'scorers', label: 'Goleadores' },
    { id: 'teams', label: 'Equipos' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #050508 0%, #0a0f1a 50%, #050508 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,5,8,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/portal')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, color: '#64748b',
                fontSize: 13, fontWeight: 500, padding: '6px 0', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
            >
              <ArrowLeft size={16} />
              Torneos
            </button>

            {tournament && (
              <>
                <span style={{ color: '#1e293b' }}>/</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tournament.name}
                </span>
                {tournament.status === 'ACTIVE' && (
                  <div style={{ marginLeft: 'auto', flexShrink: 0, padding: '3px 9px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>ACTIVO</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 2, paddingBottom: 0, marginBottom: -1 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 18px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  color: tab === t.id ? '#10b981' : '#475569',
                  borderBottom: tab === t.id ? '2px solid #10b981' : '2px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 48px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: 66, borderRadius: 14, background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {slug && tab === 'fixture' && <FixtureTab slug={slug} />}
              {slug && tab === 'standings' && <StandingsTab slug={slug} />}
              {slug && tab === 'scorers' && <ScorersTab slug={slug} />}
              {slug && tab === 'teams' && tournament && <TeamsTab slug={slug} tournament={tournament} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div style={{ textAlign: 'center', paddingBottom: 32 }}>
        <span style={{ fontSize: 11, color: '#1e293b' }}>
          Powered by <span style={{ color: '#10b981' }}>GolManager</span>
        </span>
      </div>
    </div>
  );
}
