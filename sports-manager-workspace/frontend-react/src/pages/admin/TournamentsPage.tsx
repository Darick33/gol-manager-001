import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Plus, ArrowRight, X, Loader2 } from 'lucide-react';
import { tournamentsApi } from '../../api/tournaments.api';
import { Button } from '../../components/ui/button';
import type { SportType, TournamentFormat } from '../../types';

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Borrador', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  ACTIVE:   { label: 'Activo',   color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  FINISHED: { label: 'Finalizado', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const FORMATS: { value: TournamentFormat; label: string }[] = [
  { value: 'ROUND_ROBIN',         label: 'Round Robin'            },
  { value: 'DIRECT_ELIMINATION',  label: 'Eliminación Directa'    },
  { value: 'GROUPS_ELIMINATION',  label: 'Grupos + Eliminación'   },
];

export default function TournamentsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsApi.list,
  });

  const [form, setForm] = useState({
    name: '', sportType: 'FOOTBALL' as SportType, format: 'ROUND_ROBIN' as TournamentFormat,
    yellowCardFine: 2000, redCardFine: 5000, lateFine: 10000,
    courtFee: 0, refereeFee: 0,
    halfDurationMinutes: 45, maxRosterSize: 20,
  });

  const create = useMutation({
    mutationFn: () => tournamentsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      setShowModal(false);
      setForm({ name: '', sportType: 'FOOTBALL', format: 'ROUND_ROBIN', yellowCardFine: 2000, redCardFine: 5000, lateFine: 10000, courtFee: 0, refereeFee: 0, halfDurationMinutes: 45, maxRosterSize: 20 });
    },
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.6px' }}>
            Torneos
          </h1>
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
            {tournaments.length} torneo{tournaments.length !== 1 ? 's' : ''} registrado{tournaments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} style={{ marginRight: 6 }} /> Nuevo torneo
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 size={24} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyTournaments onNew={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tournaments.map((t, i) => {
            const status = STATUS_LABEL[t.status];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Link to={`/admin/tournaments/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 20px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)';
                    e.currentTarget.style.background = 'rgba(16,185,129,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 13,
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Trophy size={20} color="#10b981" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                        {t.name}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569' }}>
                        <span>{t.sportType === 'FOOTBALL' ? 'Fútbol' : 'Fútbol Sala'}</span>
                        <span>·</span>
                        <span>{FORMATS.find((f) => f.value === t.format)?.label}</span>
                        <span>·</span>
                        <span>{t.halfDurationMinutes} min/tiempo</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: status.color, background: status.bg,
                        padding: '4px 10px', borderRadius: 100,
                      }}>
                        {status.label}
                      </span>
                      <ArrowRight size={15} color="#334155" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <Modal onClose={() => setShowModal(false)}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
              Nuevo torneo
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Field label="Nombre del torneo">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="Copa Ciudad 2026" style={inputStyle} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Deporte">
                  <select value={form.sportType} onChange={(e) => setForm({ ...form, sportType: e.target.value as SportType })} style={inputStyle}>
                    <option value="FOOTBALL">Fútbol</option>
                    <option value="FUTSAL">Fútbol Sala</option>
                  </select>
                </Field>
                <Field label="Formato">
                  <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as TournamentFormat })} style={inputStyle}>
                    {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Min. por tiempo">
                  <input type="number" min={1} value={form.halfDurationMinutes}
                    onChange={(e) => setForm({ ...form, halfDurationMinutes: +e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Máx. jugadores">
                  <input type="number" min={1} value={form.maxRosterSize}
                    onChange={(e) => setForm({ ...form, maxRosterSize: +e.target.value })} style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <Field label="Multa amarilla ($)">
                  <input type="number" min={0} value={form.yellowCardFine}
                    onChange={(e) => setForm({ ...form, yellowCardFine: +e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Multa roja ($)">
                  <input type="number" min={0} value={form.redCardFine}
                    onChange={(e) => setForm({ ...form, redCardFine: +e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Multa tardanza ($)">
                  <input type="number" min={0} value={form.lateFine}
                    onChange={(e) => setForm({ ...form, lateFine: +e.target.value })} style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Valor cancha ($)">
                  <input type="number" min={0} value={form.courtFee}
                    onChange={(e) => setForm({ ...form, courtFee: +e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Valor árbitro ($)">
                  <input type="number" min={0} value={form.refereeFee}
                    onChange={(e) => setForm({ ...form, refereeFee: +e.target.value })} style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Creando...</> : 'Crear torneo'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyTournaments({ onNew }: { onNew: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20 }}
    >
      <Trophy size={36} color="#334155" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>Sin torneos aún</p>
      <p style={{ fontSize: 14, color: '#334155', margin: '0 0 24px' }}>Creá tu primer torneo para empezar.</p>
      <Button onClick={onNew}><Plus size={15} style={{ marginRight: 6 }} />Crear torneo</Button>
    </motion.div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540,
          background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 22, padding: '28px 28px 24px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748b',
        }}>
          <X size={15} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '9px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
