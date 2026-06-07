import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  Trophy, Calendar, Users, Zap, Shield, MapPin,
  ChevronRight, LogIn, ArrowRight, CheckCircle2, Star, Clock,
} from 'lucide-react';
import { publicApi } from '../api/public.api';
import type { Tournament } from '../types';

// ── Soccer Ball SVG ──────────────────────────────────────────────────────────
function SoccerBall({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <defs>
        <radialGradient id="ballGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
        <radialGradient id="shinGrad" cx="30%" cy="25%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#ballGrad)" />
      {/* Black pentagon patches */}
      <polygon points="50,16 64,38 57,61 43,61 36,38" fill="#0f172a" opacity="0.9" />
      <polygon points="22,22 36,20 40,38 27,48 14,40" fill="#0f172a" opacity="0.9" />
      <polygon points="78,22 86,40 73,48 60,38 64,20" fill="#0f172a" opacity="0.9" />
      <polygon points="14,60 27,52 40,62 37,78 20,80" fill="#0f172a" opacity="0.9" />
      <polygon points="86,60 80,80 63,78 60,62 73,52" fill="#0f172a" opacity="0.9" />
      <polygon points="43,61 57,61 62,80 50,90 38,80" fill="#0f172a" opacity="0.9" />
      {/* Shine */}
      <ellipse cx="36" cy="32" rx="12" ry="8" fill="url(#shinGrad)" />
    </svg>
  );
}

// ── Floating Background Balls ────────────────────────────────────────────────
const BALLS = [
  { left: '8%',  animClass: 'fb1', size: 28, delay: 0 },
  { left: '22%', animClass: 'fb2', size: 20, delay: 1.5 },
  { left: '40%', animClass: 'fb3', size: 34, delay: 0.8 },
  { left: '58%', animClass: 'fb4', size: 22, delay: 2.2 },
  { left: '74%', animClass: 'fb5', size: 30, delay: 0.4 },
  { left: '88%', animClass: 'fb6', size: 18, delay: 3 },
];

function FloatingBalls() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {BALLS.map((b, i) => (
        <div
          key={i}
          className={b.animClass}
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: b.left,
            animationDelay: `${b.delay}s`,
            opacity: 0,
          }}
        >
          <SoccerBall size={b.size} />
        </div>
      ))}
    </div>
  );
}

// ── HTML/CSS Pitch ──────────────────────────────────────────────────────────
function PitchCanvas() {
  const [score, setScore] = useState([2, 1]);
  const [goalFlash, setGoalFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGoalFlash(true);
      setTimeout(() => setGoalFlash(false), 1200);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Score bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '1px', textTransform: 'uppercase' }}>LIVE</span>
        </div>
        <motion.div
          key={score.join('-')}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <span style={{ fontSize: 36, fontWeight: 900, color: '#10b981', letterSpacing: '-1px' }}>{score[0]}</span>
          <span style={{ fontSize: 20, color: '#334155', fontWeight: 700 }}>—</span>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b', letterSpacing: '-1px' }}>{score[1]}</span>
        </motion.div>
        <AnimatePresence>
          {goalFlash && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.3 }}
              style={{
                fontSize: 13, fontWeight: 900, color: '#fbbf24',
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                padding: '4px 12px', borderRadius: 100, letterSpacing: '0.5px',
              }}
            >
              ¡GOL!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Pitch wrapper */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(16,185,129,0.25), 0 0 120px rgba(16,185,129,0.1)',
        border: '2px solid rgba(16,185,129,0.2)',
      }}>
        {/* Green surface with vertical stripes */}
        <div style={{
          position: 'absolute', inset: 0,
          background: '#166534',
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent 0px, transparent 9%,
            rgba(0,0,0,0.07) 9%, rgba(0,0,0,0.07) 18%
          )`,
        }} />

        {/* Ambient light (overhead) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* ── PITCH LINES (all as divs) ── */}

        {/* Outer boundary */}
        <div style={{
          position: 'absolute',
          inset: '6% 4%',
          border: '2px solid rgba(255,255,255,0.85)',
          pointerEvents: 'none',
        }} />

        {/* Halfway line */}
        <div style={{
          position: 'absolute',
          top: '6%', bottom: '6%',
          left: 'calc(50% - 1px)', width: 2,
          background: 'rgba(255,255,255,0.85)',
        }} />

        {/* Center circle */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '18%', aspectRatio: '1',
          border: '2px solid rgba(255,255,255,0.85)',
          borderRadius: '50%',
        }} />

        {/* Center spot */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 8, height: 8,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '50%',
        }} />

        {/* LEFT penalty area (D-shaped approximation) */}
        <div style={{
          position: 'absolute',
          top: '31%', bottom: '31%',
          left: '4%', width: '12%',
          border: '2px solid rgba(255,255,255,0.85)',
          borderLeft: 'none',
          borderRadius: '0 60% 60% 0 / 0 50% 50% 0',
        }} />

        {/* RIGHT penalty area */}
        <div style={{
          position: 'absolute',
          top: '31%', bottom: '31%',
          right: '4%', width: '12%',
          border: '2px solid rgba(255,255,255,0.85)',
          borderRight: 'none',
          borderRadius: '60% 0 0 60% / 50% 0 0 50%',
        }} />

        {/* LEFT penalty spot */}
        <div style={{
          position: 'absolute',
          top: 'calc(50% - 4px)', left: '14%',
          width: 7, height: 7,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: '50%',
        }} />

        {/* RIGHT penalty spot */}
        <div style={{
          position: 'absolute',
          top: 'calc(50% - 4px)', right: '14%',
          width: 7, height: 7,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: '50%',
        }} />

        {/* LEFT goal */}
        <div style={{
          position: 'absolute',
          top: '38%', bottom: '38%',
          left: 0, width: '4%',
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(255,255,255,0.85)',
          borderLeft: 'none',
          backdropFilter: 'blur(2px)',
        }} />

        {/* RIGHT goal */}
        <div style={{
          position: 'absolute',
          top: '38%', bottom: '38%',
          right: 0, width: '4%',
          background: goalFlash ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(255,255,255,0.85)',
          borderRight: 'none',
          transition: 'background 0.3s ease',
          backdropFilter: 'blur(2px)',
        }} />

        {/* ── PLAYERS (colored dots) ── */}
        {/* Team A (green) */}
        {[
          { top: '50%', left: '25%' },
          { top: '25%', left: '32%' },
          { top: '75%', left: '32%' },
          { top: '50%', left: '8%' }, // goalkeeper
        ].map((pos, i) => (
          <div key={`a${i}`} style={{
            position: 'absolute',
            top: pos.top, left: pos.left,
            transform: 'translate(-50%, -50%)',
            width: i === 3 ? 16 : 14, height: i === 3 ? 16 : 14,
            background: '#10b981', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.7)',
            boxShadow: '0 0 8px rgba(16,185,129,0.6)',
          }} />
        ))}

        {/* Team B (amber) */}
        {[
          { top: '50%', left: '75%' },
          { top: '25%', left: '68%' },
          { top: '75%', left: '68%' },
          { top: '50%', left: '92%' }, // goalkeeper
        ].map((pos, i) => (
          <div key={`b${i}`} style={{
            position: 'absolute',
            top: pos.top, left: pos.left,
            transform: 'translate(-50%, -50%)',
            width: i === 3 ? 16 : 14, height: i === 3 ? 16 : 14,
            background: '#f59e0b', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.7)',
            boxShadow: '0 0 8px rgba(245,158,11,0.6)',
          }} />
        ))}

        {/* ── ANIMATED BALL ── */}
        <div className="pitch-ball" style={{
          position: 'absolute',
          width: 22, height: 22,
          zIndex: 10,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
        }}>
          <SoccerBall size={22} />
        </div>

        {/* ── CORNER ARCS ── */}
        {[
          { top: '6%', left: '4%', corners: '0 50% 0 0' },
          { top: '6%', right: '4%', corners: '50% 0 0 0' },
          { bottom: '6%', left: '4%', corners: '0 0 50% 0' },
          { bottom: '6%', right: '4%', corners: '0 0 0 50%' },
        ].map((c, i) => (
          <div key={`c${i}`} style={{
            position: 'absolute',
            ...c,
            width: 20, height: 20,
            border: '2px solid rgba(255,255,255,0.7)',
            borderRadius: c.corners,
          }} />
        ))}

        {/* Goal flash overlay */}
        <AnimatePresence>
          {goalFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 96% 50%, rgba(251,191,36,0.5) 0%, transparent 50%)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Team labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Los Osos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Rayo FC</span>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        </div>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
function slugToName(slug: string) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function LeagueLogo({ name, logoUrl, size = 48 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} style={{ width: size, height: size, borderRadius: size * 0.22, objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22, flexShrink: 0,
      background: 'linear-gradient(135deg, #10b981, #059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 900, color: 'white',
      boxShadow: '0 0 20px rgba(16,185,129,0.35)',
    }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
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

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LeagueLogo name={leagueName} logoUrl={leagueInfo?.logoUrl ?? null} size={36} />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#f8fafc', letterSpacing: '-0.3px' }}>{leagueName}</span>
        </div>
        <div className="ll-nav-btns" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/portal')} className="ll-ghost-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Trophy size={14} /> Ver torneos
          </button>
          <button onClick={() => navigate('/login')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: '#10b981', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(16,185,129,0.35)', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; }}
          >
            <LogIn size={14} /> Ingresar
          </button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '95svh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Green grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Main glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Floating balls */}
        <FloatingBalls />

        <div className="ll-container ll-hero-grid" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Left: Text */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 28 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Fútbol Sala · Césped Sintético</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
              style={{ fontSize: 'clamp(38px, 5.5vw, 76px)', fontWeight: 900, color: '#f8fafc', margin: '0 0 20px', lineHeight: 1.03, letterSpacing: '-2.5px' }}
            >
              Tu cancha.<br /><span style={{ color: '#10b981' }}>Tus torneos.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#64748b', margin: '0 0 40px', maxWidth: 460, lineHeight: 1.7 }}
            >
              {leagueName} — fútbol sala de alto rendimiento en césped sintético. Jugá torneos o alquilá la cancha para tu próximo partido.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}
            >
              <button
                onClick={() => navigate('/portal')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: '#10b981', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 32px rgba(16,185,129,0.4)', transition: 'all 0.15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(16,185,129,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 32px rgba(16,185,129,0.4)'; }}
              >
                Ver torneos activos <ArrowRight size={16} />
              </button>
              <button
                onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <Calendar size={16} /> Alquilar cancha
              </button>
            </motion.div>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
            >
              {[
                { icon: Shield, text: 'Césped Pro' },
                { icon: Zap, text: 'Iluminación LED' },
                { icon: Users, text: 'Vestuarios' },
                { icon: Clock, text: 'Disponible toda la semana' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon size={12} color="#10b981" />
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Animated Pitch */}
          <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.1 }}>
            <PitchCanvas />
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)', padding: '36px 24px' }}>
        <div className="ll-container ll-stats" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { value: activeTournaments.length > 0 ? `${activeTournaments.length}` : '—', label: 'Torneos activos' },
            { value: '2', label: 'Canchas disponibles' },
            { value: '7', label: 'Días a la semana' },
            { value: '100%', label: 'Césped sintético' },
          ].map(({ value, label }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#f8fafc', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 6, fontWeight: 500 }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="servicios" style={{ padding: '96px 24px' }}>
        <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Lo que ofrecemos</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-1.5px' }}>Dos formas de jugar</h2>
          </motion.div>

          <div className="ll-services" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Tournaments card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
              onClick={() => navigate('/portal')}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{ position: 'relative', padding: '48px 40px', borderRadius: 24, background: 'linear-gradient(145deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))', border: '1px solid rgba(16,185,129,0.18)', cursor: 'pointer', overflow: 'hidden' }}
            >
              {/* Background pattern */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Trophy size={26} color="#10b981" />
                </div>
                <h3 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-0.5px' }}>Torneos</h3>
                <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 28px', lineHeight: 1.65 }}>
                  Organizamos torneos de fútbol sala con fixture automático, posiciones en vivo, estadísticas de goles y actas digitales en PDF.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                  {['Fixture automático', 'Posiciones live', 'Goleadores', 'Actas PDF', 'Árbitros'].map((f) => (
                    <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{f}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 14, fontWeight: 700 }}>
                  Ver torneos activos <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>

            {/* Rental card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{ position: 'relative', padding: '48px 40px', borderRadius: 24, background: 'linear-gradient(145deg, rgba(245,158,11,0.09), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.15)', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(245,158,11,0.02) 20px, rgba(245,158,11,0.02) 40px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Calendar size={26} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-0.5px' }}>Alquilar la Cancha</h3>
                <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 28px', lineHeight: 1.65 }}>
                  Reservá la cancha por hora para tu partido libre, entrenamiento o evento privado. Con iluminación LED para partidos nocturnos.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                  {['Reserva por hora', 'Iluminación LED', 'Vestuarios', 'Estacionamiento', 'Semana completa'].map((f) => (
                    <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{f}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 14, fontWeight: 700 }}>
                  Consultar disponibilidad <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PITCH SHOWCASE ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px' }}>
        <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Seguí el partido en vivo</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-1.5px' }}>La cancha, en tiempo real</h2>
            <p style={{ fontSize: 15, color: '#475569', margin: 0, maxWidth: 480, marginInline: 'auto' }}>
              Resultados, posiciones y estadísticas del torneo accesibles desde cualquier dispositivo, sin necesidad de cuenta.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <PitchCanvas />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              onClick={() => navigate('/portal')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: '#10b981', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 32px rgba(16,185,129,0.35)', transition: 'all 0.15s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'none'; }}
            >
              Ir al portal público <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px' }}>
        <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Las instalaciones</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-1.5px' }}>Todo lo que necesitás</h2>
          </motion.div>

          <div className="ll-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: Shield, title: 'Césped Sintético Pro', desc: 'Superficie de última generación, apta para fútbol sala de alto rendimiento y juego nocturno.', color: '#10b981' },
              { icon: Zap, title: 'Iluminación LED', desc: 'Canchas con luz LED de alta potencia, sin sombras ni puntos muertos para jugar de noche.', color: '#f59e0b' },
              { icon: Users, title: 'Vestuarios completos', desc: 'Instalaciones cómodas con duchas, casilleros y área de descanso para ambos equipos.', color: '#38bdf8' },
              { icon: Trophy, title: 'Liga Oficial', desc: 'Sistema de ligas profesional con posiciones, estadísticas y árbitros designados.', color: '#a78bfa' },
              { icon: MapPin, title: 'Ubicación central', desc: 'Acceso fácil con estacionamiento disponible para jugadores y visitantes.', color: '#f472b6' },
              { icon: Star, title: 'Alta demanda', desc: 'Una de las canchas de fútbol sala más reconocidas de la zona. Reservá con anticipación.', color: '#34d399' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                whileHover={{ borderColor: `${color}30`, transition: { duration: 0.2 } }}
                style={{ padding: '28px 24px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>{title}</h4>
                <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVE TOURNAMENTS ────────────────────────────────────────────── */}
      {activeTournaments.length > 0 && (
        <section style={{ padding: '0 24px 96px' }}>
          <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>En curso ahora</p>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-1.5px' }}>Torneos activos</h2>
              </div>
              <button onClick={() => navigate('/portal')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Ver todos <ChevronRight size={14} />
              </button>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {activeTournaments.slice(0, 6).map((t: Tournament, i: number) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4, borderColor: 'rgba(16,185,129,0.25)', transition: { duration: 0.15 } }}
                  onClick={() => navigate(`/portal/${t.slug}`)}
                  style={{ padding: '24px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={18} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: t.status === 'ACTIVE' ? '#10b981' : '#f59e0b', background: t.status === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }}>
                      {t.status === 'ACTIVE' ? 'Activo' : 'Próximo'}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>{t.name}</h4>
                  <p style={{ fontSize: 12, color: '#475569', margin: '0 0 16px' }}>{t.format ?? 'Fútbol Sala'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                    Ver detalles <ChevronRight size={12} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA DUAL ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 96px' }}>
        <div className="ll-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="ll-cta-dual" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
              onClick={() => navigate('/portal')}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              style={{ padding: '48px 40px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', textAlign: 'center' }}
            >
              <Trophy size={44} color="#10b981" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px', letterSpacing: '-0.4px' }}>Portal Público</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>Seguí torneos, posiciones y resultados en tiempo real. Sin cuenta necesaria.</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, background: '#10b981', color: 'white', fontSize: 14, fontWeight: 700 }}>
                Acceder <ArrowRight size={15} />
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.15)', transition: { duration: 0.15 } }}
              style={{ padding: '48px 40px', borderRadius: 24, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center' }}
            >
              <LogIn size={44} color="#64748b" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px', letterSpacing: '-0.4px' }}>Zona de Acceso</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>Para admins, vocales y delegados. Gestioná torneos, multas y pagos.</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>
                Ingresar <ArrowRight size={15} />
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', background: 'rgba(255,255,255,0.01)' }}>
        <div className="ll-container ll-footer" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LeagueLogo name={leagueName} logoUrl={leagueInfo?.logoUrl ?? null} size={30} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{leagueName}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Portal', icon: CheckCircle2, action: () => navigate('/portal') },
              { label: 'Ingresar', icon: LogIn, action: () => navigate('/login') },
            ].map(({ label, icon: Icon, action }) => (
              <button key={label} onClick={action}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
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

      {/* ── CSS ANIMATIONS ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }

        /* Ball rolling across the pitch */
        @keyframes pitch-ball-anim {
          0%   { top: 50%; left: 18%; transform: translate(-50%,-50%) rotate(0deg); }
          10%  { top: 35%; left: 28%; transform: translate(-50%,-50%) rotate(72deg); }
          20%  { top: 50%; left: 40%; transform: translate(-50%,-50%) rotate(144deg); }
          30%  { top: 62%; left: 50%; transform: translate(-50%,-50%) rotate(216deg); }
          40%  { top: 45%; left: 62%; transform: translate(-50%,-50%) rotate(288deg); }
          50%  { top: 30%; left: 72%; transform: translate(-50%,-50%) rotate(360deg); }
          58%  { top: 50%; left: 82%; transform: translate(-50%,-50%) rotate(420deg); }
          62%  { top: 50%; left: 87%; transform: translate(-50%,-50%) rotate(440deg); }
          65%  { top: 50%; left: 84%; transform: translate(-50%,-50%) rotate(450deg); }
          75%  { top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(520deg); }
          85%  { top: 50%; left: 30%; transform: translate(-50%,-50%) rotate(580deg); }
          100% { top: 50%; left: 18%; transform: translate(-50%,-50%) rotate(720deg); }
        }
        .pitch-ball { animation: pitch-ball-anim 8s cubic-bezier(0.4,0,0.6,1) infinite; }

        /* Floating background balls */
        @keyframes float-up {
          0%   { bottom: -60px; opacity: 0; }
          8%   { opacity: 0.12; }
          92%  { opacity: 0.12; }
          100% { bottom: 110%; opacity: 0; }
        }
        .fb1 { animation: float-up 12s ease-in-out infinite; animation-delay: 0s; }
        .fb2 { animation: float-up 15s ease-in-out infinite; animation-delay: 1.5s; }
        .fb3 { animation: float-up 10s ease-in-out infinite; animation-delay: 0.8s; }
        .fb4 { animation: float-up 13s ease-in-out infinite; animation-delay: 2.2s; }
        .fb5 { animation: float-up 11s ease-in-out infinite; animation-delay: 0.4s; }
        .fb6 { animation: float-up 14s ease-in-out infinite; animation-delay: 3s; }

        /* Also add horizontal drift to floating balls */
        .fb1 { animation: float-up-drift 12s ease-in-out infinite; }
        .fb3 { animation: float-up-drift-r 10s ease-in-out infinite; animation-delay: 0.8s; }
        .fb5 { animation: float-up-drift 11s ease-in-out infinite; animation-delay: 0.4s; }
        @keyframes float-up-drift {
          0%   { bottom: -60px; transform: rotate(0deg) translateX(0px); opacity: 0; }
          8%   { opacity: 0.12; }
          50%  { transform: rotate(360deg) translateX(40px); }
          92%  { opacity: 0.12; }
          100% { bottom: 110%; transform: rotate(720deg) translateX(10px); opacity: 0; }
        }
        @keyframes float-up-drift-r {
          0%   { bottom: -60px; transform: rotate(0deg) translateX(0px); opacity: 0; }
          8%   { opacity: 0.12; }
          50%  { transform: rotate(-360deg) translateX(-40px); }
          92%  { opacity: 0.12; }
          100% { bottom: 110%; transform: rotate(-720deg) translateX(-15px); opacity: 0; }
        }

        /* Layout responsive */
        .ll-container { box-sizing: border-box; }

        @media (max-width: 768px) {
          .ll-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .ll-nav-btns .ll-ghost-btn { display: none; }
          .ll-services { grid-template-columns: 1fr !important; }
          .ll-cta-dual { grid-template-columns: 1fr !important; }
          .ll-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .ll-features { grid-template-columns: 1fr !important; }
          .ll-footer { flex-direction: column; align-items: center; text-align: center; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .ll-features { grid-template-columns: repeat(2, 1fr) !important; }
        }

        * { box-sizing: border-box; }
        button { font-family: inherit; }
      `}</style>
    </div>
  );
}
