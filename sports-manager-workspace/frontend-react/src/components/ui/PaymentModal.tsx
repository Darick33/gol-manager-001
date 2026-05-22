import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, CreditCard, CheckCircle, Building2, Shield, AlertCircle, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../api/fines.api';
import { finesApi } from '../../api/fines.api';
import { balanceApi } from '../../api/balance.api';
import { ImageUpload } from './ImageUpload';
import { useToast } from './toast';
import type { Team, Tournament, PaymentMethod } from '../../types';

const COP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface Props {
  matchId: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  tournament: Tournament;
  defaultTeamId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({
  matchId,
  homeTeam,
  awayTeam,
  tournament,
  defaultTeamId,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const [teamId, setTeamId]         = useState(defaultTeamId ?? '');
  const [method, setMethod]         = useState<PaymentMethod>('CASH');
  const [amountStr, setAmountStr]   = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  const teams = [homeTeam, awayTeam].filter(Boolean) as Team[];
  const selectedTeam = teams.find((t) => t.id === teamId);

  // load fines and existing payments for this match
  const { data: allFines = [] } = useQuery({
    queryKey: ['fines', 'match', matchId],
    queryFn: () => finesApi.listByMatch(matchId),
    enabled: !!matchId,
  });
  const { data: allPayments = [] } = useQuery({
    queryKey: ['payments', 'match', matchId],
    queryFn: () => paymentsApi.listByMatch(matchId),
    enabled: !!matchId,
  });

  const teamFines    = allFines.filter((f) => f.teamId === teamId);
  const finesTotal   = teamFines.reduce((s, f) => s + f.amount, 0);
  const refFee       = tournament.refereeFeeEnabled ? tournament.refereeFee : 0;
  const matchTotal   = teamId ? tournament.courtFee + refFee + finesTotal : 0;

  // existing payment for this team+match
  const existingPayment = allPayments.find((p) => p.teamId === teamId) ?? null;

  // outstanding balance from OTHER matches
  // balance in DB already includes this match's charges, so we add matchTotal back to isolate other matches
  const { data: balanceSummary } = useQuery({
    queryKey: ['balance', teamId, tournament.id],
    queryFn: () => balanceApi.getTeamSummary(teamId, tournament.id),
    enabled: !!teamId && !existingPayment,
  });
  const previousDebt = balanceSummary
    ? Math.abs(Math.min(0, balanceSummary.balance + matchTotal))
    : 0;
  const total = matchTotal + previousDebt;

  // pre-fill amount when team or fines change
  useEffect(() => {
    if (total > 0 && !existingPayment) setAmountStr(String(total));
  }, [total, existingPayment]);

  const amount     = parseFloat(amountStr) || 0;
  const canSubmit  = teamId && amount > 0 && (method === 'CASH' || receiptUrl);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await paymentsApi.registerMatchPayment({
        matchId,
        teamId,
        tournamentId: tournament.id,
        method,
        amount,
        ...(receiptUrl ? { receiptUrl } : {}),
      });
      setDone(true);
      toast.success(`Pago de ${selectedTeam?.name ?? 'equipo'} registrado`);
      setTimeout(() => { onClose(); onSuccess?.(); }, 1400);
    } catch {
      toast.error('Error al registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        style={{
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '24px', width: '100%', maxWidth: 400,
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Registrar Pago</h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b',
          }}>
            <X size={14} />
          </button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0' }}>
            <CheckCircle size={44} color="#10b981" />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#34d399', margin: 0 }}>Pago registrado</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* team selector */}
            {!defaultTeamId && (
              <div>
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Equipo
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {teams.map((t) => (
                    <button key={t.id} onClick={() => setTeamId(t.id)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                        background: teamId === t.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        border: teamId === t.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: teamId === t.id ? '#818cf8' : '#64748b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      {t.logoUrl && (
                        <img src={t.logoUrl} alt={t.name} width={18} height={18}
                          style={{ borderRadius: 5, objectFit: 'cover' }} />
                      )}
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Estado del pago ya registrado ── */}
            {teamId && existingPayment && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                {existingPayment.status === 'APPROVED' ? (
                  <div style={{
                    borderRadius: 12, padding: '14px 16px',
                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={16} color="#10b981" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Pago aprobado</span>
                      <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                        {COP(existingPayment.amount)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600,
                      }}>
                        {existingPayment.method === 'CASH' ? 'Efectivo' : 'Transferencia'}
                      </span>
                      <span style={{ fontSize: 11, color: '#475569' }}>
                        {new Date(existingPayment.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {existingPayment.receiptUrl && (
                      <a href={existingPayment.receiptUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Ver comprobante <CreditCard size={10} />
                      </a>
                    )}
                  </div>
                ) : existingPayment.status === 'PENDING' ? (
                  <div style={{
                    borderRadius: 12, padding: '14px 16px',
                    background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Banknote size={16} color="#eab308" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fde047' }}>Comprobante en revisión</span>
                      <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                        {COP(existingPayment.amount)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                      El comprobante está siendo revisado por la administración.
                    </p>
                    {existingPayment.receiptUrl && (
                      <a href={existingPayment.receiptUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Ver comprobante <CreditCard size={10} />
                      </a>
                    )}
                  </div>
                ) : (
                  /* REJECTED — allow re-registration */
                  <div style={{
                    borderRadius: 12, padding: '10px 14px', marginBottom: -4,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                      El pago anterior fue rechazado. Podés registrar uno nuevo.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Formulario (solo si no hay pago válido) ── */}
            {teamId && (!existingPayment || existingPayment.status === 'REJECTED') && (
              <>
                {/* breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                >
                  <BreakdownRow icon={<Building2 size={11} color="#64748b" />} label="Cancha" amount={tournament.courtFee} />
                  {tournament.refereeFeeEnabled && (
                    <BreakdownRow icon={<Shield size={11} color="#64748b" />} label="Árbitro" amount={tournament.refereeFee} />
                  )}
                  {teamFines.map((fine) => (
                    <BreakdownRow
                      key={fine.id}
                      icon={<AlertCircle size={11} color="#f59e0b" />}
                      label={fine.reason}
                      amount={fine.amount}
                      accent="#f59e0b"
                    />
                  ))}
                  {previousDebt > 0 && (
                    <>
                      <div style={{ height: 1, background: 'rgba(239,68,68,0.15)', margin: '2px 0' }} />
                      <BreakdownRow
                        icon={<TrendingDown size={11} color="#ef4444" />}
                        label="Deuda partidos anteriores"
                        amount={previousDebt}
                        accent="#ef4444"
                      />
                    </>
                  )}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Total a pagar</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>{COP(total)}</span>
                  </div>
                </motion.div>

                {/* method */}
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Método de pago
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button onClick={() => setMethod('CASH')} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: method === 'CASH' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                      border: method === 'CASH' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      color: method === 'CASH' ? '#10b981' : '#64748b', transition: 'all 0.15s',
                    }}>
                      <Banknote size={13} /> Efectivo
                    </button>
                    <button onClick={() => setMethod('TRANSFER')} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: method === 'TRANSFER' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                      border: method === 'TRANSFER' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      color: method === 'TRANSFER' ? '#60a5fa' : '#64748b', transition: 'all 0.15s',
                    }}>
                      <CreditCard size={13} /> Transferencia
                    </button>
                  </div>
                </div>

                {/* amount */}
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Monto ($)
                  </label>
                  <input
                    type="number" inputMode="numeric" min={0}
                    value={amountStr} onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                      padding: '10px 12px', color: '#f1f5f9', fontSize: 15,
                      fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>

                {/* receipt upload */}
                <AnimatePresence>
                  {method === 'TRANSFER' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}
                    >
                      <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                        Comprobante de pago
                      </label>
                      <ImageUpload
                        value={receiptUrl} onChange={setReceiptUrl}
                        shape="square" size={100} placeholder="Subir comprobante" folder="receipts"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* actions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button onClick={onClose} style={{
                    flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#64748b', fontSize: 13, fontWeight: 600,
                  }}>
                    Cancelar
                  </button>
                  <button onClick={handleSubmit} disabled={saving || !canSubmit} style={{
                    flex: 1, padding: '11px', borderRadius: 10,
                    cursor: canSubmit && !saving ? 'pointer' : 'not-allowed',
                    background: canSubmit ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: canSubmit ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    color: canSubmit ? '#818cf8' : '#334155',
                    fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1,
                  }}>
                    {saving ? 'Guardando...' : 'Registrar'}
                  </button>
                </div>
              </>
            )}

            {/* close button when already paid */}
            {teamId && existingPayment && existingPayment.status !== 'REJECTED' && (
              <button onClick={onClose} style={{
                width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748b', fontSize: 13, fontWeight: 600,
              }}>
                Cerrar
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function BreakdownRow({ icon, label, amount, accent }: {
  icon: React.ReactNode; label: string; amount: number; accent?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        {icon}
        <span style={{ fontSize: 11, color: accent ?? '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: accent ?? '#94a3b8', flexShrink: 0 }}>
        {COP(amount)}
      </span>
    </div>
  );
}
