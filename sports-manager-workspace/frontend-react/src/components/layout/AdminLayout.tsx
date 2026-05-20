import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useMobile } from '../../hooks/useMobile';

export default function AdminLayout() {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: '#05050a' }}>
      {/* Backdrop overlay (mobile only) */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 40,
          }}
        />
      )}

      <Sidebar
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar (mobile only) */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            height: 56,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(5,5,10,0.95)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            flexShrink: 0,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f1f5f9',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Menu size={20} />
            </button>
            <span style={{ marginLeft: 12, fontWeight: 700, fontSize: 16, color: '#f8fafc' }}>
              Gol<span style={{ color: '#10b981' }}>Manager</span>
            </span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ padding: isMobile ? '20px 16px' : '32px 36px', flex: 1 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
