import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, Radio, AlertTriangle, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tournamentsApi } from '../../api/tournaments.api';
import { paymentsApi } from '../../api/fines.api';
import { useAuthStore } from '../../store/auth.store';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function StatCard({ icon: Icon, label, value, color, to, index }: {
  icon: React.ElementType; label: string; value: string | number;
  color: string; to: string; index: number;
}) {
  const rgb = hexToRgb(color);
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible">
      <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18,
            padding: '22px 24px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, background 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `rgba(${rgb},0.25)`;
            e.currentTarget.style.background = 'rgba(255,255,255,0.045)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 140, height: 140,
            background: `radial-gradient(circle at top right, rgba(${rgb},0.1) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: `rgba(${rgb},0.12)`,
            border: `1px solid rgba(${rgb},0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Icon size={18} color={color} />
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: '#f8fafc',
            letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums',
          }}>
            {value}
          </div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 4, fontWeight: 500 }}>{label}</div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: tournaments = [] } = useQuery({ queryKey: ['tournaments'], queryFn: tournamentsApi.list });
  const { data: pendingPayments = [] } = useQuery({ queryKey: ['payments', 'pending'], queryFn: paymentsApi.listPending });

  const active = tournaments.filter((t) => t.status === 'ACTIVE').length;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 36 }}
      >
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#f8fafc',
          margin: '0 0 6px', letterSpacing: '-0.8px',
        }}>
          Buen día, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
          Resumen general de GolManager
        </p>
      </motion.div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 40,
      }}>
        <StatCard index={0} icon={Trophy}       label="Torneos totales"   value={tournaments.length}        color="#10b981" to="/admin/tournaments" />
        <StatCard index={1} icon={Trophy}       label="Torneos activos"   value={active}                    color="#3b82f6" to="/admin/tournaments" />
        <StatCard index={2} icon={Users}        label="Equipos"           value="—"                         color="#8b5cf6" to="/admin/teams"       />
        <StatCard index={3} icon={AlertTriangle} label="Pagos pendientes" value={pendingPayments.length}    color="#f59e0b" to="/admin/payments"    />
      </div>

      {/* Active tournaments list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            Torneos activos
          </h2>
          <Link to="/admin/tournaments" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#10b981', textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>
            Ver todos <ArrowRight size={13} />
          </Link>
        </div>

        {tournaments.filter((t) => t.status === 'ACTIVE').length === 0 ? (
          <EmptyState icon={Radio} text="No hay torneos activos. Creá uno en la sección Torneos." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tournaments.filter((t) => t.status === 'ACTIVE').map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07, duration: 0.4 }}
              >
                <Link to={`/admin/tournaments/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'border-color 0.2s, background 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)';
                    e.currentTarget.style.background = 'rgba(16,185,129,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Trophy size={16} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                          {t.sportType === 'FOOTBALL' ? 'Fútbol' : 'Fútbol Sala'} · {
                            t.format === 'ROUND_ROBIN' ? 'Round Robin' :
                            t.format === 'DIRECT_ELIMINATION' ? 'Eliminación directa' : 'Grupos + Eliminación'
                          }
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={15} color="#334155" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{
      padding: '40px 24px', textAlign: 'center',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 16,
    }}>
      <Icon size={28} color="#334155" style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>{text}</p>
    </div>
  );
}

function hexToRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
