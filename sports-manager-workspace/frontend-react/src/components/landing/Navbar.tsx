import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Menu, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const links = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Cómo funciona', href: '#how' },
  { label: 'Demo', href: '#demo' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const isMobile = useIsMobile();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40));

  const showBg = scrolled || menuOpen;

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease',
        padding: '0 24px',
        background: showBg ? 'rgba(5, 5, 10, 0.92)' : 'transparent',
        backdropFilter: showBg ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: showBg ? 'blur(20px)' : 'none',
        borderBottom: showBg ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <nav style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="GolManager" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            Gol<span style={{ color: '#10b981' }}>Manager</span>
          </span>
        </a>

        {/* Desktop nav links */}
        {!isMobile && (
          <ul style={{ display: 'flex', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  style={{
                    color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500,
                    padding: '8px 16px', borderRadius: 8, transition: 'color 0.2s', display: 'block',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f8fafc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Desktop CTA / Mobile hamburger */}
        {isMobile ? (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#f8fafc', padding: 8, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 44, minHeight: 44,
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href="/portal"
              style={{
                color: '#10b981', textDecoration: 'none',
                padding: '10px 18px', borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                border: '1px solid rgba(16,185,129,0.25)',
                background: 'rgba(16,185,129,0.06)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.06)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.25)';
              }}
            >
              Ver torneos
            </a>
            <a
              href="/login"
              style={{
                color: '#94a3b8', textDecoration: 'none',
                padding: '10px 18px', borderRadius: 10,
                fontSize: 14, fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#f8fafc';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              Acceder
            </a>
            <a
              href="#cta"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', textDecoration: 'none',
                padding: '10px 20px', borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              Empezar gratis
            </a>
          </div>
        )}
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    color: '#94a3b8', textDecoration: 'none', fontSize: 16, fontWeight: 500,
                    padding: '13px 8px', borderRadius: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'color 0.15s',
                    minHeight: 44, display: 'flex', alignItems: 'center',
                  }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/portal"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#10b981', textDecoration: 'none',
                  padding: '14px 20px', borderRadius: 12, marginTop: 10,
                  fontSize: 15, fontWeight: 600, textAlign: 'center',
                  minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(16,185,129,0.25)',
                  background: 'rgba(16,185,129,0.07)',
                }}
              >
                Ver torneos
              </a>
              <a
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#f1f5f9', textDecoration: 'none',
                  padding: '14px 20px', borderRadius: 12, marginTop: 8,
                  fontSize: 15, fontWeight: 600, textAlign: 'center',
                  minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                Acceder al panel
              </a>
              <a
                href="#cta"
                onClick={() => setMenuOpen(false)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', textDecoration: 'none',
                  padding: '14px 20px', borderRadius: 12, marginTop: 8,
                  fontSize: 15, fontWeight: 600, textAlign: 'center',
                  minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                Empezar gratis
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
