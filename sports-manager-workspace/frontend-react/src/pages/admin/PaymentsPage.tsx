import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { paymentsApi } from '../../api/fines.api';
import { teamsApi } from '../../api/teams.api';
import { useAuthStore } from '../../store/auth.store';
import type { Payment, Team } from '../../types';

// ── animation ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ── helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(url) || url.includes('cloudinary');
}

// ── ConfirmBar ─────────────────────────────────────────────────────────────
function ConfirmBar({ onConfirm, onCancel, loading, action }: {
  onConfirm: () => void; onCancel: () => void;
  loading: boolean; action: 'approve' | 'reject';
}) {
  const isApprove = action === 'approve';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 10,
        background: isApprove ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isApprove ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
        ¿Confirmás {isApprove ? 'aprobar' : 'rechazar'} este pago?
      </span>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onCancel}
          style={{
            padding: '5px 12px', borderRadius: 7, height: 32,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7, height: 32,
            background: isApprove ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${isApprove ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
            color: isApprove ? '#10b981' : '#ef4444',
            fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}>
          {loading && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
          {isApprove ? 'Aprobar' : 'Rechazar'}
        </button>
      </div>
    </motion.div>
  );
}

// ── PaymentCard ────────────────────────────────────────────────────────────
function PaymentCard({ payment, team, index, adminId }: {
  payment: Payment; team?: Team; index: number; adminId: string;
}) {
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const qc = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => paymentsApi.approve(payment.id, adminId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments', 'pending'] }),
    onSettled: () => setPending(null),
  });

  const rejectMutation = useMutation({
    mutationFn: () => paymentsApi.reject(payment.id, adminId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments', 'pending'] }),
    onSettled: () => setPending(null),
  });

  const loading = approveMutation.isPending || rejectMutation.isPending;
  const primary = team?.primaryColor ?? '#475569';
  const initials = team?.name.slice(0, 2).toUpperCase() ?? '??';
  const isImg = isImageUrl(payment.receiptUrl);

  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      {/* team + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {team?.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} width={36} height={36}
              style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${primary}55, ${primary}22)`,
              border: `1px solid ${primary}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: primary,
            }}>
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team?.name ?? 'Equipo desconocido'}
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              {formatDate(payment.createdAt)}
            </div>
          </div>
        </div>
        <div style={{
          padding: '3px 10px', borderRadius: 20, flexShrink: 0,
          background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#eab308' }}>Por revisar</span>
        </div>
      </div>

      {/* receipt */}
      {isImg ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
          <img
            src={payment.receiptUrl}
            alt="Comprobante de pago"
            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
          />
          <a
            href={payment.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute', top: 8, right: 8,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
              color: '#e2e8f0', fontSize: 11, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Ver completo <ExternalLink size={10} />
          </a>
        </div>
      ) : (
        <a
          href={payment.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            color: '#94a3b8', fontSize: 12, fontWeight: 600, textDecoration: 'none',
          }}
        >
          Ver comprobante <ExternalLink size={12} />
        </a>
      )}

      {/* action buttons or confirm bar */}
      <AnimatePresence mode="wait">
        {pending ? (
          <ConfirmBar
            key="confirm"
            action={pending}
            loading={loading}
            onCancel={() => setPending(null)}
            onConfirm={() => {
              if (pending === 'approve') approveMutation.mutate();
              else rejectMutation.mutate();
            }}
          />
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
          >
            <button
              onClick={() => setPending('reject')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                height: 44, borderRadius: 10,
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.16)',
                color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
            >
              <XCircle size={14} /> Rechazar
            </button>
            <button
              onClick={() => setPending('approve')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                height: 44, borderRadius: 10,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
                color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
            >
              <CheckCircle2 size={14} /> Aprobar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── skeleton ───────────────────────────────────────────────────────────────
function PaymentSkeleton({ index }: { index: number }) {
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ width: 100, height: 15, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ width: 70,  height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
        <div style={{ width: 72, height: 22, borderRadius: 20, background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ height: 140, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </motion.div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const user = useAuthStore((s) => s.user);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: paymentsApi.listPending,
  });

  // extract unique team IDs
  const uniqueTeamIds = useMemo(
    () => [...new Set(payments.map((p) => p.teamId))],
    [payments],
  );

  // async-parallel: all team queries fire simultaneously via useQueries
  const teamResults = useQueries({
    queries: uniqueTeamIds.map((id) => ({
      queryKey: ['team', id],
      queryFn: () => teamsApi.getById(id),
    })),
  });

  // js-index-maps
  const teamMap = useMemo<Record<string, Team>>(() => {
    const map: Record<string, Team> = {};
    teamResults.forEach((r) => { if (r.data) map[r.data.id] = r.data; });
    return map;
  }, [teamResults]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }} style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard size={16} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>
            Pagos
          </h1>
          {payments.length > 0 && (
            <div style={{
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.22)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#eab308', fontVariantNumeric: 'tabular-nums' }}>
                {payments.length} por revisar
              </span>
            </div>
          )}
        </div>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
          Comprobantes subidos por los delegados esperando tu aprobación.
        </p>
      </motion.div>

      {/* ── content ── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => <PaymentSkeleton key={i} index={i} />)}
        </div>
      ) : payments.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18,
        }}>
          <CheckCircle2 size={38} color="#10b981" style={{ marginBottom: 14, opacity: 0.5 }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: 15 }}>
            No hay pagos pendientes.
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#334155' }}>
            Cuando un delegado suba un comprobante, aparecerá acá para revisarlo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {payments.map((payment, i) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              team={teamMap[payment.teamId]}
              index={i}
              adminId={user?.id ?? ''}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
