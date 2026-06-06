import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { getLeagueUsers, createVocal, createDelegate, createSuperAdmin, updateUserStatus } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/button';
import type { User, UserRole } from '../../types';

// ── constants ──────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, { label: string; color: string; bg: string }> = {
  PLATFORM_ADMIN: { label: 'Platform Admin', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  SUPER_ADMIN:    { label: 'Admin',          color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  VOCAL:          { label: 'Vocal',          color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  DELEGATE:       { label: 'Delegado',       color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '10px 12px',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, background 0.15s',
};

// ── UsersPage ──────────────────────────────────────────────────────────────

type ModalType = 'vocal' | 'delegate' | 'super-admin' | null;

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalType>(null);
  const currentUser = useAuthStore((s) => s.user);
  const isPlatformAdmin = currentUser?.role === 'PLATFORM_ADMIN';

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getLeagueUsers,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateUserStatus(id, active),
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: ['users'] });
      const previous = qc.getQueryData<User[]>(['users']);
      qc.setQueryData<User[]>(['users'], (old = []) =>
        old.map((u) => (u.id === id ? { ...u, active } : u)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['users'], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const displayUsers = isPlatformAdmin
    ? users.filter((u) => u.role === 'VOCAL' || u.role === 'DELEGATE' || u.role === 'SUPER_ADMIN')
    : users.filter((u) => u.role === 'VOCAL' || u.role === 'DELEGATE');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={16} color="#10b981" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.5px' }}>
              Usuarios
            </h1>
            <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
              {displayUsers.length} usuario{displayUsers.length !== 1 ? 's' : ''} en esta liga
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isPlatformAdmin && (
            <Button
              variant="outline"
              onClick={() => setModal('super-admin')}
              style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}
            >
              <Plus size={14} style={{ marginRight: 5 }} /> Nuevo Admin
            </Button>
          )}
          <Button variant="outline" onClick={() => setModal('vocal')}>
            <Plus size={14} style={{ marginRight: 5 }} /> Nuevo Vocal
          </Button>
          <Button onClick={() => setModal('delegate')}>
            <Plus size={14} style={{ marginRight: 5 }} /> Nuevo Delegado
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <UsersSkeleton />
      ) : displayUsers.length === 0 ? (
        <EmptyUsers
          isPlatformAdmin={isPlatformAdmin}
          onAdmin={() => setModal('super-admin')}
          onVocal={() => setModal('vocal')}
          onDelegate={() => setModal('delegate')}
        />
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto auto auto',
            gap: 12,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11, fontWeight: 700, color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            <span>Nombre</span>
            <span>Email</span>
            <span>Rol</span>
            <span>Estado</span>
            <span></span>
          </div>

          {/* Rows */}
          {displayUsers.map((user, i) => (
            <UserRow
              key={user.id}
              user={user}
              index={i}
              isLast={i === displayUsers.length - 1}
              isToggling={toggleActive.isPending && toggleActive.variables?.id === user.id}
              onToggle={() => toggleActive.mutate({ id: user.id, active: !(user.active ?? true) })}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {modal && (
          <CreateUserModal
            type={modal}
            onClose={() => setModal(null)}
            onSuccess={() => {
              void qc.invalidateQueries({ queryKey: ['users'] });
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: rgba(16,185,129,0.4) !important; background: rgba(16,185,129,0.06) !important; }
      `}</style>
    </div>
  );
}

// ── UserRow ────────────────────────────────────────────────────────────────

function UserRow({
  user, index, isLast, isToggling, onToggle,
}: {
  user: User;
  index: number;
  isLast: boolean;
  isToggling: boolean;
  onToggle: () => void;
}) {
  const roleBadge = ROLE_BADGE[user.role] ?? ROLE_BADGE.VOCAL;
  const active = user.active ?? true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto auto auto',
        gap: 12,
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Name */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user.name}
      </div>

      {/* Email */}
      <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user.email}
      </div>

      {/* Role chip */}
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: roleBadge.color, background: roleBadge.bg,
        padding: '3px 9px', borderRadius: 100,
        whiteSpace: 'nowrap',
      }}>
        {roleBadge.label}
      </span>

      {/* Active badge */}
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: active ? '#10b981' : '#64748b',
        background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
        padding: '3px 9px', borderRadius: 100,
        whiteSpace: 'nowrap',
      }}>
        {active ? 'Activo' : 'Inactivo'}
      </span>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', borderRadius: 8,
          background: active ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
          border: active ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(16,185,129,0.15)',
          color: active ? '#ef4444' : '#10b981',
          fontSize: 12, fontWeight: 600,
          cursor: isToggling ? 'not-allowed' : 'pointer',
          opacity: isToggling ? 0.6 : 1,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {isToggling && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
        {active ? 'Desactivar' : 'Activar'}
      </button>
    </motion.div>
  );
}

// ── CreateUserModal ────────────────────────────────────────────────────────

function CreateUserModal({
  type, onClose, onSuccess,
}: {
  type: 'vocal' | 'delegate' | 'super-admin';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    whatsappNumber: '',
  });
  const [error, setError] = useState('');

  const createUser = useMutation({
    mutationFn: () => {
      if (type === 'vocal') {
        return createVocal({ name: form.name, email: form.email, password: form.password });
      }
      if (type === 'super-admin') {
        return createSuperAdmin({ name: form.name, email: form.email, password: form.password });
      }
      return createDelegate({
        name: form.name,
        email: form.email,
        password: form.password,
        whatsappNumber: form.whatsappNumber || undefined,
      });
    },
    onSuccess,
    onError: (err: { response?: { status: number; data?: { message?: string } } }) => {
      if (err.response?.status === 409) {
        setError('Ya existe un usuario con ese email.');
      } else {
        setError(err.response?.data?.message ?? 'Ocurrió un error al crear el usuario.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createUser.mutate();
  };

  const title = type === 'vocal' ? 'Nuevo Vocal' : type === 'super-admin' ? 'Nuevo Administrador' : 'Nuevo Delegado';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%', maxWidth: 440,
          background: '#0d0d14',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '28px 28px 24px',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.4px' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b', cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ModalField label="Nombre *">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Juan Pérez"
              style={inputStyle}
            />
          </ModalField>

          <ModalField label="Email *">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder="juan@ejemplo.com"
              style={inputStyle}
            />
          </ModalField>

          <ModalField label="Contraseña *">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </ModalField>

          {type === 'delegate' && (
            <ModalField label="WhatsApp (opcional)">
              <input
                value={form.whatsappNumber}
                onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                placeholder="+54 9 11 1234-5678"
                style={inputStyle}
              />
            </ModalField>
          )}

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 13,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite', marginRight: 5 }} />Creando...</>
                : 'Crear'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── ModalField ─────────────────────────────────────────────────────────────

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: '#64748b', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.4px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyUsers({
  isPlatformAdmin, onAdmin, onVocal, onDelegate,
}: {
  isPlatformAdmin: boolean;
  onAdmin: () => void;
  onVocal: () => void;
  onDelegate: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        textAlign: 'center', padding: '60px 24px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20,
      }}
    >
      <Users size={36} color="#334155" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>Sin usuarios aún</p>
      <p style={{ fontSize: 14, color: '#334155', margin: '0 0 24px' }}>
        {isPlatformAdmin
          ? 'Creá el primer administrador, vocal o delegado para esta liga.'
          : 'Creá el primer vocal o delegado para esta liga.'}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {isPlatformAdmin && (
          <Button
            variant="outline"
            onClick={onAdmin}
            style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}
          >
            <Plus size={14} style={{ marginRight: 5 }} />Nuevo Admin
          </Button>
        )}
        <Button variant="outline" onClick={onVocal}><Plus size={14} style={{ marginRight: 5 }} />Nuevo Vocal</Button>
        <Button onClick={onDelegate}><Plus size={14} style={{ marginRight: 5 }} />Nuevo Delegado</Button>
      </div>
    </motion.div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function UsersSkeleton() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          height: 52,
          borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          background: 'rgba(255,255,255,0.015)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}
