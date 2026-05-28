import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Trophy,
  Users,
  AlertTriangle,
  CreditCard,
  Radio,
  LogOut,
  X,
  Trophy as Logo,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const NAV = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/tournaments', icon: Trophy,          label: 'Torneos'            },
  { to: '/admin/teams',       icon: Users,           label: 'Equipos'            },
  { to: '/admin/fines',       icon: AlertTriangle,   label: 'Multas'             },
  { to: '/admin/payments',    icon: CreditCard,      label: 'Pagos'              },
  { to: '/admin/matches',     icon: Radio,           label: 'Partidos'           },
];

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobile = false, isOpen = true, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (isMobile) onClose?.();
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: isMobile ? (isOpen ? 0 : -280) : 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        width: 240,
        minHeight: '100svh',
        background: isMobile ? '#05050a' : 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100svh',
        zIndex: isMobile ? 50 : 'auto',
        overflowY: 'auto',
      }}
    >
      {/* Header: logo + close button on mobile */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="GolManager" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            Gol<span style={{ color: '#10b981' }}>Manager</span>
          </span>
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={handleNavClick}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 12px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? '#f1f5f9' : '#64748b',
              background: isActive ? 'rgba(16,185,129,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(16,185,129,0.15)' : '1px solid transparent',
              transition: 'all 0.15s ease',
              minHeight: 44,
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} color={isActive ? '#10b981' : '#64748b'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
            {user?.name ?? 'Usuario'}
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>
            {user?.role === 'SUPER_ADMIN' ? 'Administrador' : user?.role === 'VOCAL' ? 'Vocal' : 'Delegado'}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 12px',
            borderRadius: 10,
            background: 'transparent',
            border: '1px solid transparent',
            color: '#64748b',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            minHeight: 44,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </motion.aside>
  );
}
