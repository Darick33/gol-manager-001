import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus } from 'lucide-react';
import { leaguesApi } from '../../api/leagues.api';
import { Button } from '../../components/ui/button';
import type { League } from '../../types';

const STATUS_LABEL: Record<League['status'], { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Activa',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  SUSPENDED: { label: 'Suspendida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

export default function LeaguesPage() {
  const navigate = useNavigate();

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['leagues'],
    queryFn: leaguesApi.list,
  });

  const goToCreate = () => navigate('/admin/leagues/new');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.6px' }}>
            Ligas
          </h1>
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
            {leagues.length} liga{leagues.length !== 1 ? 's' : ''} registrada{leagues.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={goToCreate}>
          <Plus size={15} style={{ marginRight: 6 }} /> Nueva liga
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <LeaguesSkeleton />
      ) : leagues.length === 0 ? (
        <EmptyLeagues onNew={goToCreate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leagues.map((league, i) => (
            <LeagueRow key={league.id} league={league} index={i} />
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ---- Row -------------------------------------------------------------------
function LeagueRow({ league, index }: { league: League; index: number }) {
  const status = STATUS_LABEL[league.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 20px', borderRadius: 16,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
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

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          {league.name}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
          <span>slug: <code style={{ color: '#94a3b8' }}>{league.slug}</code></span>
          {league.subdomain && (
            <>
              <span>·</span>
              <span>subdominio: <code style={{ color: '#94a3b8' }}>{league.subdomain}</code></span>
            </>
          )}
          <span>·</span>
          <span>{new Date(league.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: status.color, background: status.bg,
        padding: '4px 10px', borderRadius: 100, flexShrink: 0,
      }}>
        {status.label}
      </span>
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
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}
