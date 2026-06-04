import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export default function PlatformLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: '#05050a' }}>
      {/* Top nav */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 56,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,5,10,0.95)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="GolManager"
            style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
          />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            Gol<span style={{ color: '#10b981' }}>Manager</span>
            <span style={{ color: '#475569', fontWeight: 400, marginLeft: 6 }}>— Plataforma</span>
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <span style={{ fontSize: 13, color: '#475569' }}>
              {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
