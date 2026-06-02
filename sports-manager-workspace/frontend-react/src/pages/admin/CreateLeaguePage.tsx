import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { leaguesApi } from '../../api/leagues.api';
import { Button } from '../../components/ui/button';
import { ImageUpload } from '../../components/ui/ImageUpload';

const SLUG_RE = /^[a-z0-9-]+$/;

export default function CreateLeaguePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leagues'] });
      navigate('/admin/leagues');
    },
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
    <div>
      {/* Back nav */}
      <button
        onClick={() => navigate('/admin/leagues')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#64748b', fontSize: 13, fontWeight: 500,
          marginBottom: 28, padding: 0,
        }}
      >
        <ArrowLeft size={15} /> Volver a ligas
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.6px' }}>
          Nueva liga
        </h1>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
          Configurá los datos de la nueva liga.
        </p>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: 520,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '28px 28px 24px',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Logo */}
          <Field label="Logo (opcional)">
            <ImageUpload
              value={form.logoUrl}
              onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
              folder="league-logos"
              shape="square"
              size={80}
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
          <Field label="Slug *">
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
            {slugError ? (
              <span style={{ fontSize: 11, color: '#f87171', marginTop: 4, display: 'block' }}>
                {slugError}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'block' }}>
                Solo letras minúsculas, números y guiones. Ej: <code style={{ color: '#64748b' }}>mi-liga</code>
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

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="outline" type="button" onClick={() => navigate('/admin/leagues')}>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: rgba(16,185,129,0.4) !important; background: rgba(16,185,129,0.06) !important; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: '#64748b', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.4px',
      }}>
        {label}
      </label>
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
