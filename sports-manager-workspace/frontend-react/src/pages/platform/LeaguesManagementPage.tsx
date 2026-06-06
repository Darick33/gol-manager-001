import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { getAllLeagues, updateLeagueStatus, enterLeague } from '../../api/platform.api';
import { Button } from '../../components/ui/button';
import type { League } from '../../types';

const STATUS_LABEL: Record<League['status'], { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Activa',     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  SUSPENDED: { label: 'Suspendida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

function isLocalhost(): boolean {
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

function buildLeagueUrl(slug: string, token: string): string {
  if (isLocalhost()) {
    return `http://localhost:5173?league=${slug}&handshake=${token}`;
  }
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN as string | undefined;
  const base = baseDomain ?? 'golmanager.com';
  return `https://${slug}.${base}?handshake=${token}`;
}

export default function LeaguesManagementPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['platform', 'leagues'],
    queryFn: getAllLeagues,
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      updateLeagueStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['platform', 'leagues'] });
      const previous = qc.getQueryData<League[]>(['platform', 'leagues']);
      qc.setQueryData<League[]>(['platform', 'leagues'], (old = []) =>
        old.map((l) => (l.id === id ? { ...l, status } : l)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['platform', 'leagues'], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'leagues'] });
    },
  });

  const [enteringId, setEnteringId] = useState<string | null>(null);

  const handleEnter = async (league: League) => {
    setEnteringId(league.id);
    try {
      const { handshake_token } = await enterLeague(league.id);
      window.open(buildLeagueUrl(league.slug, handshake_token), '_blank');
    } catch {
      // silently ignore
    } finally {
      setEnteringId(null);
    }
  };

  return (
    <div>
      <div className="lm-page-header">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.6px' }}>
            Ligas
          </h1>
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
            {leagues.length} liga{leagues.length !== 1 ? 's' : ''} registrada{leagues.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/platform/leagues/new')}>
          <Plus size={15} style={{ marginRight: 6 }} /> Nueva liga
        </Button>
      </div>

      {isLoading ? (
        <LeaguesSkeleton />
      ) : leagues.length === 0 ? (
        <EmptyLeagues onNew={() => navigate('/platform/leagues/new')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leagues.map((league, i) => (
            <LeagueRow
              key={league.id}
              league={league}
              index={i}
              isEntering={enteringId === league.id}
              isToggling={toggleStatus.isPending && toggleStatus.variables?.id === league.id}
              onToggle={() =>
                toggleStatus.mutate({
                  id: league.id,
                  status: league.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                })
              }
              onEnter={() => handleEnter(league)}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes lm-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes lm-spin { to { transform: rotate(360deg); } }

        .lm-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 32px;
        }

        /* League row */
        .lm-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .lm-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .lm-row-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .lm-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .lm-action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: inherit;
        }

        /* Mobile ≤600px */
        @media (max-width: 600px) {
          .lm-page-header { margin-bottom: 20px; }

          .lm-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px 16px;
          }
          .lm-row-left { gap: 10px; }
          .lm-row-right {
            justify-content: space-between;
          }
          .lm-action-btn {
            flex: 1;
            justify-content: center;
            padding: 8px 10px;
          }
        }
      `}</style>
    </div>
  );
}

// ---- Row -------------------------------------------------------------------
function LeagueRow({
  league, index, isEntering, isToggling, onToggle, onEnter,
}: {
  league: League;
  index: number;
  isEntering: boolean;
  isToggling: boolean;
  onToggle: () => void;
  onEnter: () => void;
}) {
  const status = STATUS_LABEL[league.status];
  const isActive = league.status === 'ACTIVE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="lm-row"
    >
      {/* Left: logo + info */}
      <div className="lm-row-left">
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {league.logoUrl
            ? <img src={league.logoUrl} alt={league.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Globe size={20} color="#10b981" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
            {league.name}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
            <span><code style={{ color: '#94a3b8' }}>{league.slug}</code></span>
            {league.subdomain && (
              <span>· <code style={{ color: '#94a3b8' }}>{league.subdomain}</code></span>
            )}
            <span>· {new Date(league.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Right: status + actions */}
      <div className="lm-row-right">
        <span className="lm-badge" style={{ color: status.color, background: status.bg }}>
          {status.label}
        </span>

        <button
          onClick={onToggle}
          disabled={isToggling}
          className="lm-action-btn"
          style={{
            background: isActive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            border: isActive ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
            color: isActive ? '#ef4444' : '#10b981',
            cursor: isToggling ? 'not-allowed' : 'pointer',
            opacity: isToggling ? 0.6 : 1,
          }}
        >
          {isToggling && <Loader2 size={11} style={{ animation: 'lm-spin 1s linear infinite' }} />}
          {isActive ? 'Suspender' : 'Activar'}
        </button>

        <button
          onClick={onEnter}
          disabled={isEntering || !isActive}
          className="lm-action-btn"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10b981',
            cursor: isEntering || !isActive ? 'not-allowed' : 'pointer',
            opacity: isEntering || !isActive ? 0.5 : 1,
          }}
        >
          {isEntering
            ? <Loader2 size={11} style={{ animation: 'lm-spin 1s linear infinite' }} />
            : <ExternalLink size={11} />}
          Entrar
        </button>
      </div>
    </motion.div>
  );
}

// ---- Empty state -----------------------------------------------------------
function EmptyLeagues({ onNew }: { onNew: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        textAlign: 'center', padding: '60px 24px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20,
      }}
    >
      <Globe size={36} color="#334155" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>Sin ligas aún</p>
      <p style={{ fontSize: 14, color: '#334155', margin: '0 0 24px' }}>Creá la primera liga para empezar.</p>
      <Button onClick={onNew}><Plus size={15} style={{ marginRight: 6 }} />Crear liga</Button>
    </motion.div>
  );
}

// ---- Loading skeleton ------------------------------------------------------
function LeaguesSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 80, borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          animation: 'lm-pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}
