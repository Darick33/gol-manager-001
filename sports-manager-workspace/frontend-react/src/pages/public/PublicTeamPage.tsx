import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { publicApi, type PublicTournament } from '../../api/public.api';
import { playersApi } from '../../api/teams.api';
import type { Player } from '../../types';

type TeamInfo = PublicTournament['teams'][number];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function TeamLogo({ name, logoUrl, color, size = 38 }: { name: string; logoUrl: string | null; color: string | null; size?: number }) {
  const c = color ?? '#475569';
  return logoUrl ? (
    <img src={logoUrl} alt={name} style={{ width: size, height: size, borderRadius: size * 0.26, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.12)' }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: `linear-gradient(135deg, ${c}55, ${c}22)`, border: `2px solid ${c}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 900, color: c,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function PlayerCard({ player, team, goals, scorerRank, index, onClick }: {
  player: Player;
  team: TeamInfo;
  goals: number;
  scorerRank: number;
  index: number;
  onClick: () => void;
}) {
  const accent = team.primaryColor ?? '#10b981';

  return (
    <motion.button
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        background: goals > 0
          ? `linear-gradient(150deg, ${accent}10 0%, rgba(255,255,255,0.02) 100%)`
          : 'rgba(255,255,255,0.025)',
        border: goals > 0 ? `1px solid ${accent}28` : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '16px 14px',
        cursor: 'pointer', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* scorer badge */}
      {scorerRank > 0 && scorerRank <= 3 && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 13, lineHeight: 1,
        }}>
          {scorerRank === 1 ? '🥇' : scorerRank === 2 ? '🥈' : '🥉'}
        </div>
      )}

      {/* photo */}
      <div style={{ position: 'relative' }}>
        {player.photoUrl ? (
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${accent}50`, boxShadow: goals > 0 ? `0 0 16px ${accent}30` : 'none' }}>
            <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          </div>
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `${accent}1a`, border: `2px solid ${accent}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: accent,
          }}>
            {player.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: -2, right: -4,
          background: '#080b14', border: `1px solid ${accent}55`,
          borderRadius: 6, padding: '1px 5px',
          fontSize: 10, fontWeight: 800, color: accent, lineHeight: '16px',
        }}>
          #{player.dorsal}
        </div>
      </div>

      {/* name */}
      <div style={{ width: '100%' }}>
        <p style={{
          fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {player.name}
        </p>
      </div>

      {/* goals pill */}
      {goals > 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: `${accent}18`, border: `1px solid ${accent}30`,
          borderRadius: 20, padding: '3px 10px',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: accent }}>
            {goals} {goals === 1 ? 'gol' : 'goles'}
          </span>
        </div>
      ) : (
        <span style={{ fontSize: 10, color: '#2d3748', fontWeight: 500 }}>Sin goles</span>
      )}
    </motion.button>
  );
}

export default function PublicTeamPage() {
  const { slug, teamId } = useParams<{ slug: string; teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const teamFromState = (location.state as { team?: TeamInfo } | null)?.team;

  const { data: tournament } = useQuery({
    queryKey: ['public', 'tournament', slug],
    queryFn: () => publicApi.getTournament(slug!),
    enabled: !!slug,
  });

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players', 'public', teamId],
    queryFn: () => playersApi.getByTeam(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
  });

  const { data: scorers = [] } = useQuery({
    queryKey: ['public', 'scorers', slug],
    queryFn: () => publicApi.getScorers(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const { data: standings = [] } = useQuery({
    queryKey: ['public', 'standings', slug],
    queryFn: () => publicApi.getStandings(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const team = teamFromState ?? tournament?.teams.find(t => t.id === teamId);
  const accent = team?.primaryColor ?? '#10b981';

  const teamPosition = standings.findIndex(r => r.team.id === teamId) + 1;

  const goalsByPlayer = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of scorers) map[s.player.id] = s.goals;
    return map;
  }, [scorers]);

  const scorerRankByPlayer = useMemo(() => {
    const map: Record<string, number> = {};
    scorers.forEach((s, i) => { map[s.player.id] = i + 1; });
    return map;
  }, [scorers]);

  const sortedPlayers = [...players].sort((a, b) =>
    (goalsByPlayer[b.id] ?? 0) - (goalsByPlayer[a.id] ?? 0) || a.dorsal - b.dorsal
  );

  const totalGoals = players.reduce((sum, p) => sum + (goalsByPlayer[p.id] ?? 0), 0);
  const topScorer = scorers.find(s => players.some(p => p.id === s.player.id));

  const handlePlayerClick = (player: Player) => {
    navigate(`/portal/${slug}/equipos/${teamId}/jugadores/${player.id}`, {
      state: { player, team },
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #050508 0%, #0a0f1a 50%, #050508 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* sticky header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,5,8,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '0 20px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, color: '#64748b',
              fontSize: 13, fontWeight: 500, padding: '6px 0', transition: 'color 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
          >
            <ArrowLeft size={16} />
            Equipos
          </button>
          {team && (
            <>
              <span style={{ color: '#1e293b' }}>/</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {team.name}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 60px' }}>
        {/* hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            margin: '24px 0 28px',
            borderRadius: 20,
            background: `linear-gradient(160deg, ${accent}20 0%, ${accent}08 50%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid ${accent}22`,
            padding: '32px 24px 28px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* glow */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 200,
            background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {team && <TeamLogo name={team.name} logoUrl={team.logoUrl} color={team.primaryColor} size={80} />}

          <div style={{ textAlign: 'center', position: 'relative' }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.6px', lineHeight: 1.1 }}>
              {team?.name ?? '—'}
            </h1>
            {tournament && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                {tournament.logoUrl && (
                  <img src={tournament.logoUrl} alt={tournament.name} style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{tournament.name}</span>
              </div>
            )}
          </div>

          {/* quick stats */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
            {/* posición en el torneo */}
            {teamPosition > 0 && (() => {
              const posColor = teamPosition === 1 ? '#f59e0b' : teamPosition === 2 ? '#94a3b8' : teamPosition === 3 ? '#c2844a' : '#64748b';
              const posBg   = teamPosition === 1 ? 'rgba(245,158,11,0.1)' : teamPosition === 2 ? 'rgba(148,163,184,0.08)' : teamPosition === 3 ? 'rgba(194,132,74,0.08)' : 'rgba(255,255,255,0.05)';
              const posBorder = teamPosition === 1 ? '1px solid rgba(245,158,11,0.25)' : teamPosition === 2 ? '1px solid rgba(148,163,184,0.2)' : teamPosition === 3 ? '1px solid rgba(194,132,74,0.2)' : '1px solid rgba(255,255,255,0.08)';
              return (
                <div style={{ background: posBg, border: posBorder, borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: posColor, display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                    {teamPosition === 1 ? '🥇' : teamPosition === 2 ? '🥈' : teamPosition === 3 ? '🥉' : `#${teamPosition}`}
                  </span>
                  <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Posición
                  </span>
                </div>
              );
            })()}
            <div style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '6px 14px', textAlign: 'center',
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                {players.length}
              </span>
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Jugadores
              </span>
            </div>
            <div style={{
              background: totalGoals > 0 ? `${accent}12` : 'rgba(255,255,255,0.05)',
              border: totalGoals > 0 ? `1px solid ${accent}28` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '6px 14px', textAlign: 'center',
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: totalGoals > 0 ? accent : '#475569', display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                {totalGoals}
              </span>
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Goles
              </span>
            </div>
            {topScorer && (
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)',
                borderRadius: 10, padding: '6px 14px', textAlign: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', display: 'block' }}>
                  {topScorer.player.name.split(' ')[0]}
                </span>
                <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Top goleador
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* section title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Plantel
          </h2>
          {!loadingPlayers && (
            <span style={{
              fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
              padding: '1px 8px', color: '#475569',
            }}>
              {players.length}
            </span>
          )}
        </div>

        {/* players grid */}
        {loadingPlayers ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 160, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : sortedPlayers.length === 0 ? (
          <p style={{ color: '#334155', fontSize: 14, textAlign: 'center', padding: '48px 0' }}>
            Sin jugadores registrados.
          </p>
        ) : (
          team && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {sortedPlayers.map((player, i) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team={team}
                  goals={goalsByPlayer[player.id] ?? 0}
                  scorerRank={scorerRankByPlayer[player.id] ?? 0}
                  index={i}
                  onClick={() => handlePlayerClick(player)}
                />
              ))}
            </div>
          )
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
