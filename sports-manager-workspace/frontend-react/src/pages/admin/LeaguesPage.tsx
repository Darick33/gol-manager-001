import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { leaguesApi } from '../../api/leagues.api';
import { Button } from '../../components/ui/button';
import { ImageUpload } from '../../components/ui/ImageUpload';
import type { League } from '../../types';

const STATUS_LABEL: Record<League['status'], { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Activa',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  SUSPENDED: { label: 'Suspendida', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

export default function LeaguesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['leagues'],
    queryFn: leaguesApi.list,
  });

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
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} style={{ marginRight: 6 }} /> Nueva liga
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <LeaguesSkeleton />
      ) : leagues.length === 0 ? (
        <EmptyLeagues onNew={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leagues.map((league, i) => (
            <LeagueRow key={league.id} league={league} index={i} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <CreateLeagueModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['leagues'] });
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input:focus { border-color: rgba(16,185,129,0.4) !important; background: rgba(16,185,129,0.06) !important; }
      `}</style>
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

// ---- Create League Modal ---------------------------------------------------
interface CreateLeagueModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SLUG_RE = /^[a-z0-9-]+$/;

function CreateLeagueModal({ onClose, onSuccess }: CreateLeagueModalProps) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    subdomain: '',
    logoUrl: null as string | null,
  });
  const [slugError, setSlugError] = useState('');
  const [serverError, setServerError] = useState('');

  const create = useMutation({
    mutationFn: () =>
      leaguesApi.create({
        name: form.name,
        slug: form.slug,
        subdomain: form.subdomain || undefined,
        logoUrl: form.logoUrl,
      }),
    onSuccess,
    onError: (err: { response?: { status: number } }) => {
      if (err.response?.status === 409) {
        setServerError('Ya existe una liga con ese slug.');
      } else {
        setServerError('Ocurrió un error al crear la liga.');
      }
    },
  });

  const handleSlugChange = (val: string) => {
    const lower = val.toLowerCase();
    setForm((f) => ({ ...f, slug: lower }));
    if (lower && !SLUG_RE.test(lower)) {
      setSlugError('Solo letras minúsculas, números y guiones.');
    } else {
      setSlugError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!SLUG_RE.test(form.slug)) {
      setSlugError('Solo letras minúsculas, números y guiones.');
      return;
    }
    create.mutate();
  };

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
          width: '100%', maxWidth: 480,
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

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
          Nueva liga
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Logo */}
          <Field label="Logo (opcional)">
            <ImageUpload
              value={form.logoUrl}
              onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              folder="league-logos"
              shape="square"
              size={72}
              placeholder="Logo"
            />
          </Field>

          {/* Name */}
          <Field label="Nombre *">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Liga Metropolitana"
              style={inputStyle}
            />
          </Field>

          {/* Slug */}
          <Field label="Slug *" hint="Solo letras minúsculas, números y guiones">
            <input
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              placeholder="liga-metropolitana"
              style={{
                ...inputStyle,
                borderColor: slugError ? 'rgba(239,68,68,0.5)' : undefined,
              }}
            />
            {slugError && (
              <span style={{ fontSize: 11, color: '#f87171', marginTop: 4, display: 'block' }}>
                {slugError}
              </span>
            )}
          </Field>

          {/* Subdomain */}
          <Field label="Subdominio (opcional)">
            <input
              value={form.subdomain}
              onChange={(e) => setForm((f) => ({ ...f, subdomain: e.target.value }))}
              placeholder="metro"
              style={inputStyle}
            />
            <span style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'block' }}>
              Ej: <code style={{ color: '#64748b' }}>metro</code> → metro.golmanager.com
            </span>
          </Field>

          {/* Server error */}
          {serverError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 13,
            }}>
              <AlertCircle size={14} />
              {serverError}
            </div>
          )}

          {create.isSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981', fontSize: 13,
            }}>
              <CheckCircle size={14} />
              Liga creada correctamente.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending || !!slugError}>
              {create.isPending
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Creando...</>
                : 'Crear liga'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ---- Helpers ---------------------------------------------------------------
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: '#64748b', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.4px',
      }}>
        {label}
      </label>
      {hint && (
        <span style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 6 }}>{hint}</span>
      )}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s, background 0.15s',
};
