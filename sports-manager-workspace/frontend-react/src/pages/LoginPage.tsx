import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/button';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (data) => {
      login(data.user, data.access_token);
      const onLeagueSubdomain = (() => {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return !!new URLSearchParams(window.location.search).get('league');
        const base = import.meta.env.VITE_BASE_DOMAIN as string | undefined;
        return h.split('.').length > (base ? base.split('.').length : 2);
      })();
      if (data.user.role === 'PLATFORM_ADMIN' && !onLeagueSubdomain) {
        navigate('/platform');
      } else {
        navigate('/admin');
      }
    },
    onError: () => {
      setError('Email o contraseña incorrectos.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  return (
    <div
      style={{
        minHeight: '100svh',
        background: '#05050a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translateX(-50%)', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '28px 28px', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 15,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 32px rgba(16,185,129,0.4)',
          }}>
            <Trophy size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Gol<span style={{ color: '#10b981' }}>Manager</span>
          </h1>
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
            Ingresá a tu cuenta para continuar
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '32px 28px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@golmanager.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 12px 10px 36px',
                    color: '#f1f5f9',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 12px 10px 36px',
                    color: '#f1f5f9',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', fontSize: 13,
                }}
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <Button type="submit" size="lg" disabled={mutation.isPending} style={{ marginTop: 4 }}>
              {mutation.isPending ? 'Ingresando...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Ingresar <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#334155' }}>
          ¿Necesitás acceso?{' '}
          <a href="#cta" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
            Contactanos
          </a>
        </p>
      </motion.div>
    </div>
  );
}
