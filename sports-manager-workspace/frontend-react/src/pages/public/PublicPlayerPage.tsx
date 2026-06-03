import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { publicApi, type PublicTournament } from '../../api/public.api';
import { playersApi } from '../../api/teams.api';
import type { Player } from '../../types';

type TeamInfo = PublicTournament['teams'][number];

export default function PublicPlayerPage() {
  const { slug, teamId, playerId } = useParams<{ slug: string; teamId: string; playerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { player?: Player; team?: TeamInfo } | null;
  const playerFromState = state?.player;
  const teamFromState = state?.team;

  const { data: tournament } = useQuery({
    queryKey: ['public', 'tournament', slug],
    queryFn: () => publicApi.getTournament(slug!),
    enabled: !!slug,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players', 'public', teamId],
    queryFn: () => playersApi.getByTeam(teamId!),
    enabled: !!teamId && !playerFromState,
    staleTime: 60_000,
  });

  const { data: scorers = [] } = useQuery({
    queryKey: ['public', 'scorers', slug],
    queryFn: () => publicApi.getScorers(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const team = teamFromState ?? tournament?.teams.find(t => t.id === teamId);
  const player = playerFromState ?? players.find(p => p.id === playerId);
  const accent = team?.primaryColor ?? '#10b981';

  const goals = useMemo(
    () => scorers.find(s => s.player.id === playerId)?.goals ?? 0,
    [scorers, playerId]
  );
  const scorerRank = useMemo(
    () => {
      const idx = scorers.findIndex(s => s.player.id === playerId);
      return idx >= 0 ? idx + 1 : 0;
    },
    [scorers, playerId]
  );

  const rankColor = scorerRank === 1 ? '#f59e0b' : scorerRank === 2 ? '#94a3b8' : scorerRank === 3 ? '#c2844a' : '#64748b';
  const rankEmoji = scorerRank === 1 ? '🥇' : scorerRank === 2 ? '🥈' : scorerRank === 3 ? '🥉' : null;

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
        <div style={{ maxWidth: 600, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
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
            {team?.name ?? 'Equipo'}
          </button>
          {player && (
            <>
              <span style={{ color: '#1e293b' }}>/</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {player.name}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            borderRadius: 24,
            background: `linear-gradient(160deg, ${accent}22 0%, ${accent}08 50%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid ${accent}25`,
            padding: '40px 24px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            marginBottom: 20, position: 'relative', overflow: 'hidden',
            boxShadow: `0 0 80px ${accent}10`,
          }}
        >
          {/* ambient glow */}
          <div style={{
            position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
            width: 280, height: 280,
            background: `radial-gradient(circle, ${accent}18 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          {/* photo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'relative' }}
          >
            {player?.photoUrl ? (
              <div style={{
                width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
                border: `3px solid ${accent}60`,
                boxShadow: `0 0 40px ${accent}35, 0 8px 32px rgba(0,0,0,0.5)`,
              }}>
                <img
                  src={player.photoUrl} alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                />
              </div>
            ) : (
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: `linear-gradient(135deg, ${accent}40, ${accent}12)`,
                border: `3px solid ${accent}60`,
                boxShadow: `0 0 40px ${accent}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34, fontWeight: 900, color: accent,
              }}>
                {player?.name.split(' ').map(w => w[0]).slice(0, 2).join('') ?? '?'}
              </div>
            )}

            {/* dorsal badge */}
            <div style={{
              position: 'absolute', bottom: 0, right: -6,
              background: '#080b14', border: `2px solid ${accent}55`,
              borderRadius: 10, padding: '3px 8px',
              fontSize: 13, fontWeight: 900, color: accent, lineHeight: '18px',
              boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
            }}>
              #{player?.dorsal ?? '—'}
            </div>
          </motion.div>

          {/* name + team */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
            style={{ textAlign: 'center', position: 'relative' }}
          >
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.6px', lineHeight: 1.1 }}>
              {player?.name ?? '—'}
            </h1>
            {team && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 }}>
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={team.name} style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{team.name}</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}
        >
          {/* goals */}
          <div style={{
            background: goals > 0 ? `linear-gradient(150deg, ${accent}12, ${accent}04)` : 'rgba(255,255,255,0.025)',
            border: goals > 0 ? `1px solid ${accent}30` : '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '28px 20px', textAlign: 'center',
            boxShadow: goals > 0 ? `0 0 32px ${accent}10` : 'none',
          }}>
            <div style={{
              fontSize: 52, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              color: goals > 0 ? accent : '#2d3748',
              marginBottom: 8,
            }}>
              {goals}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Goles
            </div>
          </div>

          {/* ranking */}
          <div style={{
            background: scorerRank > 0 && scorerRank <= 3 ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.025)',
            border: scorerRank > 0 && scorerRank <= 3 ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '28px 20px', textAlign: 'center',
          }}>
            {rankEmoji ? (
              <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 4 }}>{rankEmoji}</div>
            ) : (
              <div style={{
                fontSize: 52, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                color: scorerRank > 0 ? rankColor : '#2d3748',
                marginBottom: 8,
              }}>
                {scorerRank > 0 ? `#${scorerRank}` : '—'}
              </div>
            )}
            {rankEmoji && (
              <div style={{ fontSize: 22, fontWeight: 900, color: rankColor, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
                #{scorerRank}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Goleadores
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ textAlign: 'center', paddingBottom: 32 }}>
        <span style={{ fontSize: 11, color: '#1e293b' }}>
          Powered by <span style={{ color: '#10b981' }}>GolManager</span>
        </span>
      </div>
    </div>
  );
}
