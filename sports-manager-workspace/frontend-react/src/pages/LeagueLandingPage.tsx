import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Calendar, Users, Zap, Shield, MapPin,
  ChevronRight, LogIn, ArrowRight, CheckCircle2, Star,
} from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { Tournament } from '../types';

// ── animations ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.42, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

// ── helpers ──────────────────────────────────────────────────────────────────
function slugToName(slug: string) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function TournamentStatusBadge({ status }: { status: Tournament['status'] }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:    { label: 'Activo',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    DRAFT:     { label: 'Próximo',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    FINISHED:  { label: 'Finalizado', color: '#64748b', bg: 'rgba(255,255,255,0.06)' },
    CANCELLED: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };
  const s = map[status] ?? map.DRAFT;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
      color: s.color, background: s.bg, letterSpacing: '0.3px',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// ── Logo component ───────────────────────────────────────────────────────────
function LeagueLogo({ name, logoUrl, size = 48 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl} alt={name}
        style={{ width: size, height: size, borderRadius: size * 0.22, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22, flexShrink: 0,
      background: 'linear-gradient(135deg, #10b981, #059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: 'white',
      boxShadow: '0 0 20px rgba(16,185,129,0.4)',
    }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function LeagueLandingPage() {
  const navigate = useNavigate();

  const { data: leagueInfo } = useQuery({
    queryKey: ['public-league-info'],
    queryFn: publicApi.getLeagueInfo,
    retry: 1,
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['public-tournaments-landing'],
    queryFn: publicApi.getTournaments,
    retry: 1,
  });

  const leagueName = leagueInfo?.name ?? slugToName(window.location.hostname.split('.')[0] ?? 'La Cancha');
  const activeTournaments = (tournaments as Tournament[]).filter((t) => t.status === 'ACTIVE' || t.status === 'DRAFT');

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#05050a', minHeight: '100svh', overflowX: 'clip' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="ll-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LeagueLogo name={leagueName} logoUrl={leagueInfo?.logoUrl ?? null} size={36} />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            {leagueName}
          </span>
        </div>
        <div className="ll-nav-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/portal')}
            className="ll-btn-ghost"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 10,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Trophy size={14} /> Ver torneos
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10,
              background: '#10b981', border: 'none',
              color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap',
              boxShadow: '0 0 16px rgba(16,185,129,0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; }}
          >
            <LogIn size={14} /> Ingresar
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '92svh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Pitch grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />
        {/* Center circle accent */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600,
          borderRadius: '50%',
          border: '1px solid rgba(16,185,129,0.06)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300, height: 300,
          borderRadius: '50%',
          border: '1px solid rgba(16,185,129,0.08)',
          pointerEvents: 'none',
        }} />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translateX(-50%)',
          width: 800, height: 500,
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.09) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div className="ll-container" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              marginBottom: 28,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Fútbol Sala · Césped Sintético
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="ll-hero-title"
            style={{ fontSize: 'clamp(36px, 7vw, 80px)', fontWeight: 900, color: '#f8fafc', margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-2px' }}
          >
            Tu cancha.<br />
            <span style={{ color: '#10b981' }}>Tus torneos.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="ll-hero-sub"
            style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#64748b', margin: '0 0 44px', maxWidth: 540, lineHeight: 1.65 }}
          >
            Jugá en {leagueName} — césped sintético de alta performance para fútbol sala. Alquilá la cancha o participá de un torneo.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
          >
            <button
              onClick={() => navigate('/portal')}
              className="ll-cta-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 12,
                background: '#10b981', border: 'none',
                color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 32px rgba(16,185,129,0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'none'; }}
            >
              Ver torneos activos <ArrowRight size={16} />
            </button>
            <button
              onClick={() => document.getElementById('alquiler')?.scrollIntoView({ behavior: 'smooth' })}
              className="ll-cta-secondary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#f1f5f9', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <Calendar size={16} /> Alquilar cancha
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          animation: 'bounce-y 2s ease-in-out infinite',
        }}>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.4))' }} />
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.015)',
        padding: '32px 24px',
      }}>
        <div className="ll-container ll-stats" style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}>
          {[
            { value: activeTournaments.length > 0 ? `${activeTournaments.length}` : '—', label: 'Torneos activos', icon: Trophy },
            { value: '2', label: 'Canchas disponibles', icon: MapPin },
            { value: '100%', label: 'Césped sintético', icon: Star },
          ].map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              style={{ textAlign: 'center' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <Icon size={20} color="#10b981" />
              </div>
              <div style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#f8fafc', letterSpacing: '-1px' }}>{value}</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="alquiler" style={{ padding: '96px 24px' }}>
        <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
              Lo que ofrecemos
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-1px' }}>
              Dos formas de jugar
            </h2>
          </motion.div>

          <div className="ll-services-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Tournaments card */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              onClick={() => navigate('/portal')}
              style={{
                padding: '40px 36px', borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)',
                border: '1px solid rgba(16,185,129,0.15)',
                cursor: 'pointer', transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden',
              }}
              whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
            >
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 180, height: 180, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
              }} />
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}>
                <Trophy size={24} color="#10b981" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                Torneos
              </h3>
              <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
                Participá con tu equipo en torneos organizados de fútbol sala. Fases, posiciones en tiempo real y actas digitales.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                {['Fixture automático', 'Posiciones live', 'Estadísticas', 'Actas PDF'].map((f) => (
                  <span key={f} style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100,
                    background: 'rgba(16,185,129,0.1)', color: '#10b981',
                  }}>{f}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 14, fontWeight: 700 }}>
                Ver torneos <ChevronRight size={16} />
              </div>
            </motion.div>

            {/* Rental card */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
              style={{
                padding: '40px 36px', borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(245,158,11,0.02) 100%)',
                border: '1px solid rgba(245,158,11,0.12)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 180, height: 180, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
              }} />
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}>
                <Calendar size={24} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                Alquilar la Cancha
              </h3>
              <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
                Reservá por hora para tu partido libre, práctica o evento privado. Disponibilidad en tiempo real, canchas con iluminación LED.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                {['Reserva por hora', 'Iluminación LED', 'Vestuarios', 'Estacionamiento'].map((f) => (
                  <span key={f} style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100,
                    background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                  }}>{f}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 14, fontWeight: 700 }}>
                Consultar disponibilidad <ChevronRight size={16} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px', background: '#05050a' }}>
        <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
              Las instalaciones
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-1px' }}>
              Todo lo que necesitás
            </h2>
          </motion.div>

          <div className="ll-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: Shield, title: 'Césped Sintético Pro', desc: 'Superficie de última generación, apta para fútbol sala de alto rendimiento.', color: '#10b981' },
              { icon: Zap, title: 'Iluminación LED', desc: 'Canchas con luz LED de alta potencia para partidos nocturnos sin problemas.', color: '#f59e0b' },
              { icon: Users, title: 'Vestuarios', desc: 'Instalaciones cómodas con duchas, casilleros y área de descanso.', color: '#38bdf8' },
              { icon: Trophy, title: 'Liga Oficial', desc: 'Sistema de ligas con posiciones, estadísticas y árbitros designados.', color: '#a78bfa' },
              { icon: MapPin, title: 'Fácil Acceso', desc: 'Ubicación central con estacionamiento disponible para todos los jugadores.', color: '#f472b6' },
              { icon: Star, title: 'Alta Demanda', desc: 'Una de las canchas de fútbol sala más reconocidas de la zona.', color: '#34d399' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                style={{
                  padding: '28px 24px', borderRadius: 18,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'border-color 0.2s',
                }}
                whileHover={{ borderColor: `${color}30` }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={20} color={color} />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>{title}</h4>
                <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVE TOURNAMENTS ───────────────────────────────────────────── */}
      {activeTournaments.length > 0 && (
        <section style={{ padding: '0 24px 96px' }}>
          <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}
            >
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
                  En curso ahora
                </p>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-1px' }}>
                  Torneos activos
                </h2>
              </div>
              <button
                onClick={() => navigate('/portal')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', borderRadius: 10,
                  background: 'transparent', border: '1px solid rgba(16,185,129,0.25)',
                  color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Ver todos <ChevronRight size={14} />
              </button>
            </motion.div>

            <div className="ll-tournaments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {activeTournaments.slice(0, 6).map((t: Tournament, i: number) => (
                <motion.div
                  key={t.id}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                  onClick={() => navigate(`/portal/${t.slug}`)}
                  style={{
                    padding: '24px 20px', borderRadius: 18,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  whileHover={{ y: -3, borderColor: 'rgba(16,185,129,0.2)', transition: { duration: 0.15 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(16,185,129,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Trophy size={18} color="#10b981" />
                    </div>
                    <TournamentStatusBadge status={t.status} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>{t.name}</h4>
                  <p style={{ fontSize: 12, color: '#475569', margin: '0 0 16px' }}>{t.format ?? 'Formato por definir'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                    Ver detalles <ChevronRight size={12} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA DUAL ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px' }}>
        <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="ll-cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Portal público */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              onClick={() => navigate('/portal')}
              style={{
                padding: '48px 40px', borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
                border: '1px solid rgba(16,185,129,0.2)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
              whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                <Trophy size={48} color="#10b981" style={{ margin: '0 auto', display: 'block' }} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px', letterSpacing: '-0.4px' }}>
                Portal Público
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
                Seguí los torneos, posiciones y resultados en tiempo real. Sin necesidad de cuenta.
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 10,
                background: '#10b981', color: 'white',
                fontSize: 14, fontWeight: 700,
              }}>
                Acceder <ArrowRight size={15} />
              </span>
            </motion.div>

            {/* Admin login */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
              onClick={() => navigate('/login')}
              style={{
                padding: '48px 40px', borderRadius: 24,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
              whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.15)', transition: { duration: 0.15 } }}
            >
              <LogIn size={48} color="#64748b" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px', letterSpacing: '-0.4px' }}>
                Zona de Acceso
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
                Para administradores, vocales y delegados. Gestioná torneos, multas y pagos.
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 10,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#f1f5f9', fontSize: 14, fontWeight: 600,
              }}>
                Ingresar <ArrowRight size={15} />
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 24px',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div className="ll-container ll-footer-inner" style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LeagueLogo name={leagueName} logoUrl={leagueInfo?.logoUrl ?? null} size={30} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{leagueName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { icon: CheckCircle2, label: 'Portal' , action: () => navigate('/portal') },
              { icon: LogIn, label: 'Ingresar', action: () => navigate('/login') },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 8,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>
            Powered by <span style={{ color: '#10b981', fontWeight: 700 }}>GolManager</span>
          </p>
        </div>
      </footer>

      {/* ── CSS ──────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes bounce-y {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        .ll-container { box-sizing: border-box; }

        /* Mobile: < 640px */
        @media (max-width: 640px) {
          .ll-nav-actions .ll-btn-ghost { display: none; }
          .ll-hero-title { letter-spacing: -1px !important; }
          .ll-services-grid { grid-template-columns: 1fr !important; }
          .ll-features-grid { grid-template-columns: 1fr !important; }
          .ll-cta-grid { grid-template-columns: 1fr !important; }
          .ll-stats { grid-template-columns: 1fr !important; gap: 32px !important; }
          .ll-footer-inner { flex-direction: column; align-items: center; text-align: center; }
        }

        /* Tablet: 641px – 900px */
        @media (min-width: 641px) and (max-width: 900px) {
          .ll-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ll-services-grid { grid-template-columns: 1fr !important; }
          .ll-cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
