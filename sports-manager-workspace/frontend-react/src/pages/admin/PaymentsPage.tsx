import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, CheckCircle2, XCircle, ExternalLink, Loader2,
  ChevronDown, ChevronUp, Banknote, FileText, Shield, Building2, AlertCircle, TrendingDown,
  Lock, LockOpen, FileCheck, Trophy, AlertTriangle,
} from 'lucide-react';
import { finesApi, paymentsApi } from '../../api/fines.api';
import { balanceApi } from '../../api/balance.api';
import { roundsApi } from '../../api/rounds.api';
import { teamsApi } from '../../api/teams.api';
import { tournamentsApi } from '../../api/tournaments.api';
import type { TournamentRound } from '../../types';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { useAuthStore } from '../../store/auth.store';
import type { Fine, Match, Payment, Team, Tournament } from '../../types';

// ── animation ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ── helpers ────────────────────────────────────────────────────────────────
const COP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

function formatDate(iso: string | null) {
  if (!iso) return 'Sin fecha';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(url) || url.includes('cloudinary');
}

function paymentBadge(payments: Payment[], teamId: string) {
  const p = payments.filter((x) => x.teamId === teamId);
  if (p.some((x) => x.status === 'APPROVED')) return 'approved';
  if (p.some((x) => x.status === 'PENDING'))  return 'pending';
  return 'none';
}

// ── RegisterPaymentModal ───────────────────────────────────────────────────
function RegisterPaymentModal({
  match, team, tournament, teamFines, onClose,
}: {
  match: Match; team: Team; tournament: Tournament; teamFines: Fine[]; onClose: () => void;
}) {
  const qc = useQueryClient();

  const refFee      = tournament.refereeFeeEnabled ? tournament.refereeFee : 0;
  const finesTotal  = teamFines.reduce((s, f) => s + f.amount, 0);
  const matchTotal  = tournament.courtFee + refFee + finesTotal;

  const { data: balanceSummary } = useQuery({
    queryKey: ['balance', team.id, tournament.id],
    queryFn: () => balanceApi.getTeamSummary(team.id, tournament.id),
    enabled: !!team.id,
  });
  const previousDebt = balanceSummary
    ? Math.abs(Math.min(0, balanceSummary.balance + matchTotal))
    : 0;
  const total = matchTotal + previousDebt;

  const [method, setMethod]         = useState<'CASH' | 'TRANSFER'>('CASH');
  const [amount, setAmount]         = useState(String(matchTotal));
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    if (total > 0) setAmount(String(total));
  }, [total]);

  const mutation = useMutation({
    mutationFn: () =>
      paymentsApi.registerMatchPayment({
        matchId: match.id,
        teamId: team.id,
        tournamentId: tournament.id,
        method,
        amount: Number(amount),
        receiptUrl: receiptUrl ?? undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments', 'match', match.id] });
      onClose();
    },
  });

  const canSubmit = Number(amount) > 0 && (method === 'CASH' || receiptUrl !== null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      padding: 16,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        style={{
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 420,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* header */}
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Registrar pago
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
            {team.name} — {formatDate(match.scheduledAt)}
          </p>
        </div>

        {/* breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 7,
        }}>
          <FeeRow icon={<Building2 size={11} />} label="Cancha" amount={tournament.courtFee} />
          {tournament.refereeFeeEnabled && (
            <FeeRow icon={<Shield size={11} />} label="Árbitro" amount={tournament.refereeFee} />
          )}
          {teamFines.map((fine) => (
            <FeeRow
              key={fine.id}
              icon={<AlertCircle size={11} color="#f59e0b" />}
              label={fine.reason}
              amount={fine.amount}
              accent="#f59e0b"
            />
          ))}
          {previousDebt > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(239,68,68,0.2)', margin: '2px 0' }} />
              <FeeRow
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
            <span style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>{COP(total)}</span>
          </div>
        </div>

        {/* method */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['CASH', 'TRANSFER'] as const).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              style={{
                flex: 1, height: 42, borderRadius: 10, fontWeight: 700,
                fontSize: 13, cursor: 'pointer',
                background: method === m ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: method === m ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: method === m ? '#818cf8' : '#64748b',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
              {m === 'CASH' ? <><Banknote size={14} /> Efectivo</> : <><FileText size={14} /> Transferencia</>}
            </button>
          ))}
        </div>

        {/* amount */}
        <div>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Monto
          </label>
          <input
            type="number" min={0} value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ej: 150000"
            style={{
              width: '100%', height: 44, borderRadius: 10, padding: '0 14px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc', fontSize: 14, fontWeight: 600, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* receipt upload (only for TRANSFER) */}
        {method === 'TRANSFER' && (
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Comprobante
            </label>
            <ImageUpload
              value={receiptUrl}
              onChange={setReceiptUrl}
              shape="square"
              size={80}
              placeholder="Subir comprobante"
              folder="receipts"
            />
          </div>
        )}

        {/* actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{
              padding: '0 18px', height: 40, borderRadius: 10, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#64748b', fontSize: 13, fontWeight: 600,
            }}>
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            style={{
              padding: '0 22px', height: 40, borderRadius: 10, cursor: canSubmit ? 'pointer' : 'not-allowed',
              background: canSubmit ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: canSubmit ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
              color: canSubmit ? '#818cf8' : '#334155',
              fontSize: 13, fontWeight: 700, opacity: mutation.isPending ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {mutation.isPending && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            Registrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── TeamPaymentPanel ───────────────────────────────────────────────────────
function TeamPaymentPanel({
  team, match, tournament, fines, payments, side,
}: {
  team: Team; match: Match; tournament: Tournament;
  fines: Fine[]; payments: Payment[]; side: 'local' | 'visitante';
}) {
  const [showModal, setShowModal] = useState(false);

  const teamFines = fines.filter((f) => f.teamId === team.id);
  const finesTotal = teamFines.reduce((s, f) => s + f.amount, 0);
  const refFee = tournament.refereeFeeEnabled ? tournament.refereeFee : 0;
  const total = tournament.courtFee + refFee + finesTotal;
  const badge = paymentBadge(payments, team.id);

  const color = team.primaryColor ?? '#475569';

  return (
    <>
      <div style={{
        flex: 1, padding: '16px', borderRadius: 14, minWidth: 0,
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* team header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} width={28} height={28}
              style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: `${color}22`, border: `1px solid ${color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color,
            }}>
              {team.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team.name}
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{side}</div>
          </div>
        </div>

        {/* fee rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
          <FeeRow icon={<Building2 size={11} />} label="Cancha" amount={tournament.courtFee} />
          {tournament.refereeFeeEnabled && (
            <FeeRow icon={<Shield size={11} />} label="Árbitro" amount={tournament.refereeFee} />
          )}
          {teamFines.map((fine) => (
            <FeeRow
              key={fine.id}
              icon={<AlertCircle size={11} color="#f59e0b" />}
              label={fine.reason}
              amount={fine.amount}
              accent="#f59e0b"
            />
          ))}
        </div>

        {/* divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }} />

        {/* total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{COP(total)}</span>
        </div>

        {/* status + action */}
        {badge === 'approved' ? (
          <div style={{
            height: 36, borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Pagado</span>
          </div>
        ) : badge === 'pending' ? (
          <div style={{
            height: 36, borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
            background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
          }}>
            <Loader2 size={13} color="#eab308" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#eab308' }}>Comprobante en revisión</span>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%', height: 36, borderRadius: 9, cursor: 'pointer',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)',
              color: '#818cf8', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
          >
            <CreditCard size={12} /> Registrar pago
          </button>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <RegisterPaymentModal
            match={match}
            team={team}
            tournament={tournament}
            teamFines={teamFines}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function FeeRow({ icon, label, amount, accent }: {
  icon: React.ReactNode; label: string; amount: number; accent?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: accent ?? '#475569', minWidth: 0 }}>
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

// ── MatchPaymentCard ───────────────────────────────────────────────────────
function MatchPaymentCard({
  match, homeTeam, awayTeam, tournament, index,
}: {
  match: Match; homeTeam?: Team; awayTeam?: Team; tournament: Tournament; index: number;
}) {
  const [open, setOpen] = useState(false);

  const { data: fines = [], isLoading: loadingFines } = useQuery({
    queryKey: ['fines', 'match', match.id],
    queryFn: () => finesApi.listByMatch(match.id),
    enabled: open,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payments', 'match', match.id],
    queryFn: () => paymentsApi.listByMatch(match.id),
    enabled: open,
  });

  const loading = loadingFines || loadingPayments;

  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, overflow: 'hidden',
      }}
    >
      {/* header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', padding: '16px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        {/* teams */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <TeamChip team={homeTeam} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>{match.homeScore}</span>
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>–</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>{match.awayScore}</span>
          </div>
          <TeamChip team={awayTeam} right />
        </div>

        {/* date + chevron */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#475569' }}>{formatDate(match.scheduledAt)}</span>
          {open ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
        </div>
      </button>

      {/* expanded content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
                  <Loader2 size={18} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, paddingTop: 14, flexWrap: 'wrap' }}>
                  {homeTeam && (
                    <TeamPaymentPanel
                      team={homeTeam} match={match} tournament={tournament}
                      fines={fines} payments={payments} side="local"
                    />
                  )}
                  {awayTeam && (
                    <TeamPaymentPanel
                      team={awayTeam} match={match} tournament={tournament}
                      fines={fines} payments={payments} side="visitante"
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TeamChip({ team, right }: { team?: Team; right?: boolean }) {
  const color = team?.primaryColor ?? '#475569';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
      flexDirection: right ? 'row-reverse' : 'row',
    }}>
      {team?.logoUrl ? (
        <img src={team.logoUrl} alt={team.name} width={22} height={22}
          style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 800, color,
        }}>
          {team?.name.slice(0, 2).toUpperCase() ?? '?'}
        </div>
      )}
      <span style={{
        fontSize: 12, fontWeight: 700, color: '#cbd5e1',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80,
      }}>
        {team?.name ?? '—'}
      </span>
    </div>
  );
}

// ── ClosedMatchRow — compact row for closed rounds ─────────────────────────
function ClosedMatchRow({ match, homeTeam, awayTeam }: {
  match: Match; homeTeam?: Team; awayTeam?: Team;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <TeamChip team={homeTeam} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#94a3b8' }}>{match.homeScore}</span>
        <span style={{ fontSize: 10, color: '#334155' }}>–</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#94a3b8' }}>{match.awayScore}</span>
      </div>
      <TeamChip team={awayTeam} right />
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        {match.actaPdfUrl ? (
          <a href={match.actaPdfUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 7,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#818cf8', fontSize: 11, fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.15s',
            }}>
            <FileCheck size={11} /> Acta
          </a>
        ) : (
          <span style={{ fontSize: 11, color: '#334155' }}>Sin acta</span>
        )}
      </div>
    </div>
  );
}

// ── CloseRoundButton ────────────────────────────────────────────────────────
function CloseRoundButton({ tournamentId, stage, onClosed }: {
  tournamentId: string; stage: number; onClosed: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => roundsApi.closeRound(tournamentId, stage),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rounds', tournamentId] });
      onClosed();
    },
  });

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', height: 34, borderRadius: 8, cursor: 'pointer',
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        color: '#f87171', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
      >
        <Lock size={11} /> Cerrar jornada
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>¿Cerrar esta jornada?</span>
      <button onClick={() => setConfirming(false)} style={{
        padding: '5px 10px', borderRadius: 7, height: 30, cursor: 'pointer',
        background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
        color: '#64748b', fontSize: 11, fontWeight: 600,
      }}>No</button>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 7, height: 30, cursor: 'pointer',
        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
        color: '#ef4444', fontSize: 11, fontWeight: 700,
        opacity: mutation.isPending ? 0.7 : 1,
      }}>
        {mutation.isPending && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
        Confirmar
      </button>
    </motion.div>
  );
}

// ── OpenRoundSection ────────────────────────────────────────────────────────
function OpenRoundSection({
  stage, matches, teamMap, tournament, index,
}: {
  stage: number; matches: Match[]; teamMap: Record<string, Team>;
  tournament: Tournament; index: number;
}) {
  const qc = useQueryClient();

  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, overflow: 'hidden',
      }}
    >
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockOpen size={12} color="#818cf8" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
            Jornada {stage}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
            color: '#10b981',
          }}>ABIERTA</span>
          <span style={{ fontSize: 11, color: '#475569' }}>
            {matches.length} partido{matches.length !== 1 ? 's' : ''}
          </span>
        </div>
        <CloseRoundButton
          tournamentId={tournament.id}
          stage={stage}
          onClosed={() => qc.invalidateQueries({ queryKey: ['rounds', tournament.id] })}
        />
      </div>

      {/* matches */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {matches.map((match, i) => (
          <MatchPaymentCard
            key={match.id}
            match={match}
            homeTeam={teamMap[match.homeTeamId]}
            awayTeam={teamMap[match.awayTeamId]}
            tournament={tournament}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── ClosedRoundSection ──────────────────────────────────────────────────────
function ClosedRoundSection({
  stage, matches, teamMap, index,
}: {
  stage: number; matches: Match[]; teamMap: Record<string, Team>; index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 18, overflow: 'hidden', opacity: 0.85,
      }}
    >
      {/* header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(71,85,105,0.15)', border: '1px solid rgba(71,85,105,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={12} color="#475569" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>
            Jornada {stage}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
            background: 'rgba(71,85,105,0.15)', border: '1px solid rgba(71,85,105,0.25)',
            color: '#64748b',
          }}>CERRADA</span>
          <span style={{ fontSize: 11, color: '#334155' }}>
            {matches.length} partido{matches.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#334155' }}>Solo actas</span>
          {expanded
            ? <ChevronUp size={14} color="#334155" />
            : <ChevronDown size={14} color="#334155" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '4px 16px 14px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {matches.map((match) => (
                <ClosedMatchRow
                  key={match.id}
                  match={match}
                  homeTeam={teamMap[match.homeTeamId]}
                  awayTeam={teamMap[match.awayTeamId]}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── CobrosTab ──────────────────────────────────────────────────────────────
function CobrosTab() {
  const [tournamentId, setTournamentId] = useState<string>('');

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsApi.list,
  });

  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ['matches', 'tournament', tournamentId],
    queryFn: () => tournamentsApi.getMatches(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds', tournamentId],
    queryFn: () => roundsApi.listByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const tournament = tournaments.find((t) => t.id === tournamentId);
  const finished = useMemo(() => matches.filter((m) => m.status === 'FINISHED'), [matches]);

  const uniqueTeamIds = useMemo(
    () => [...new Set(finished.flatMap((m) => [m.homeTeamId, m.awayTeamId]))],
    [finished],
  );

  const teamResults = useQueries({
    queries: uniqueTeamIds.map((id) => ({
      queryKey: ['team', id],
      queryFn: () => teamsApi.getById(id),
    })),
  });

  const teamMap = useMemo<Record<string, Team>>(() => {
    const map: Record<string, Team> = {};
    teamResults.forEach((r) => { if (r.data) map[r.data.id] = r.data; });
    return map;
  }, [teamResults]);

  // group finished matches by stage, separate open vs closed
  const { openGroups, closedGroups } = useMemo(() => {
    const closedStages = new Set(
      rounds.filter((r: TournamentRound) => r.status === 'CLOSED').map((r: TournamentRound) => r.stage),
    );

    const grouped = finished.reduce<Record<number, Match[]>>((acc, m) => {
      const key = m.stage ?? 0;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});

    const open: Array<{ stage: number; matches: Match[] }> = [];
    const closed: Array<{ stage: number; matches: Match[] }> = [];

    Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([stageStr, stageMatches]) => {
        const stage = Number(stageStr);
        if (closedStages.has(stage)) {
          closed.push({ stage, matches: stageMatches });
        } else {
          open.push({ stage, matches: stageMatches });
        }
      });

    return { openGroups: open, closedGroups: closed };
  }, [finished, rounds]);

  const selectStyle: React.CSSProperties = {
    height: 40, borderRadius: 10, padding: '0 12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: tournamentId ? '#e2e8f0' : '#475569', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', minWidth: 220,
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} style={selectStyle}>
          <option value="">Seleccioná un torneo</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {!tournamentId ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18,
        }}>
          <CreditCard size={32} color="#334155" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>Seleccioná un torneo para ver los cobros.</p>
        </div>
      ) : loadingMatches ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={22} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : finished.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18,
        }}>
          <Trophy size={28} color="#334155" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>No hay partidos finalizados en este torneo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* open rounds */}
          {openGroups.map(({ stage, matches: stageMatches }, i) => (
            <OpenRoundSection
              key={stage}
              stage={stage}
              matches={stageMatches}
              teamMap={teamMap}
              tournament={tournament!}
              index={i}
            />
          ))}

          {/* divider between open and closed */}
          {closedGroups.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '4px 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={11} color="#334155" />
                <span style={{ fontSize: 11, color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Jornadas cerradas
                </span>
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>
          )}

          {/* closed rounds */}
          {closedGroups.map(({ stage, matches: stageMatches }, i) => (
            <ClosedRoundSection
              key={stage}
              stage={stage}
              matches={stageMatches}
              teamMap={teamMap}
              index={openGroups.length + i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ComprobantesTab ────────────────────────────────────────────────────────
function ConfirmBar({ onConfirm, onCancel, loading, action }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean; action: 'approve' | 'reject';
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
        <button onClick={onCancel} style={{
          padding: '5px 12px', borderRadius: 7, height: 32,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
          color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Cancelar</button>
        <button onClick={onConfirm} disabled={loading} style={{
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
  const isImg = isImageUrl(payment.receiptUrl ?? '');

  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible"
      style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
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
            }}>{initials}</div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team?.name ?? 'Equipo desconocido'}
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              {new Date(payment.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#eab308' }}>Por revisar</span>
        </div>
      </div>

      {payment.receiptUrl && (isImg ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
          <img src={payment.receiptUrl} alt="Comprobante" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" style={{
            position: 'absolute', top: 8, right: 8,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            color: '#e2e8f0', fontSize: 11, fontWeight: 600, textDecoration: 'none',
          }}>
            Ver completo <ExternalLink size={10} />
          </a>
        </div>
      ) : (
        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          color: '#94a3b8', fontSize: 12, fontWeight: 600, textDecoration: 'none',
        }}>
          Ver comprobante <ExternalLink size={12} />
        </a>
      ))}

      <AnimatePresence mode="wait">
        {pending ? (
          <ConfirmBar key="confirm" action={pending} loading={loading}
            onCancel={() => setPending(null)}
            onConfirm={() => { if (pending === 'approve') approveMutation.mutate(); else rejectMutation.mutate(); }}
          />
        ) : (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => setPending('reject')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              height: 44, borderRadius: 10,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.16)',
              color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <XCircle size={14} /> Rechazar
            </button>
            <button onClick={() => setPending('approve')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              height: 44, borderRadius: 10,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
              color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <CheckCircle2 size={14} /> Aprobar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ComprobantesTab() {
  const user = useAuthStore((s) => s.user);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: paymentsApi.listPending,
  });

  const uniqueTeamIds = useMemo(() => [...new Set(payments.map((p) => p.teamId))], [payments]);

  const teamResults = useQueries({
    queries: uniqueTeamIds.map((id) => ({
      queryKey: ['team', id],
      queryFn: () => teamsApi.getById(id),
    })),
  });

  const teamMap = useMemo<Record<string, Team>>(() => {
    const map: Record<string, Team> = {};
    teamResults.forEach((r) => { if (r.data) map[r.data.id] = r.data; });
    return map;
  }, [teamResults]);

  if (isLoading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18, padding: '20px 22px', height: 240,
        }} />
      ))}
    </div>
  );

  if (payments.length === 0) return (
    <div style={{
      textAlign: 'center', padding: '80px 24px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18,
    }}>
      <CheckCircle2 size={38} color="#10b981" style={{ marginBottom: 14, opacity: 0.5 }} />
      <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: 15 }}>No hay comprobantes pendientes.</p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {payments.map((payment, i) => (
        <PaymentCard key={payment.id} payment={payment} team={teamMap[payment.teamId]} index={i} adminId={user?.id ?? ''} />
      ))}
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'cobros',        label: 'Cobros por partido' },
  { key: 'comprobantes',  label: 'Comprobantes pendientes' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function PaymentsPage() {
  const [tab, setTab] = useState<TabKey>('cobros');

  const { data: pending = [] } = useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: paymentsApi.listPending,
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* header */}
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
          {pending.length > 0 && (
            <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.22)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#eab308' }}>
                {pending.length} por revisar
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, width: 'fit-content', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: tab === key ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: tab === key ? '#818cf8' : '#475569',
              transition: 'all 0.15s',
            }}>
            {label}
            {key === 'comprobantes' && pending.length > 0 && (
              <span style={{
                marginLeft: 6, padding: '1px 6px', borderRadius: 10,
                background: 'rgba(234,179,8,0.2)', color: '#eab308', fontSize: 10, fontWeight: 700,
              }}>
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {tab === 'cobros' ? <CobrosTab /> : <ComprobantesTab />}
        </motion.div>
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
