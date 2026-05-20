import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useCountUp } from '../../hooks/useCountUp';
import { renderCanvas } from '../ui/canvas';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function StatCard({ value, suffix, label, delay }: {
  value: number; suffix: string; label: string; delay: number;
}) {
  const { count, ref } = useCountUp(value, 1800);
  const isMobile = useIsMobile();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: isMobile ? '14px 8px' : '18px 26px',
        textAlign: 'center',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{
        fontSize: isMobile ? 22 : 32,
        fontWeight: 800,
        color: '#10b981',
        letterSpacing: '-1px',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: isMobile ? 10 : 12, color: '#64748b', marginTop: isMobile ? 4 : 6, fontWeight: 500, lineHeight: 1.3 }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const isMobile = useIsMobile();

  useEffect(() => {
    renderCanvas();
  }, []);

  return (
    <section id="home" style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden' }}>

      <canvas
        id="canvas"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100svh',
        padding: '100px 24px 60px',
        textAlign: 'center',
      }}>
        {/* Badge */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="visible"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(13,13,20,0.8)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 100, padding: '5px 14px 5px 10px', marginBottom: 32,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
            <Sparkles size={14} color="#10b981" />
            <span>Temporada 2026 · Vocalia en vivo</span>
            <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }} />
            <a href="#demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#34d399', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
              Ver demo <ArrowRight size={13} />
            </a>
          </div>
        </motion.div>

        {/* Bordered headline box */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" style={{ position: 'relative', marginBottom: 32 }}>
          <Plus size={20} strokeWidth={2.5} color="#10b981" style={{ position: 'absolute', top: -10, left: -10, opacity: 0.7 }} />
          <Plus size={20} strokeWidth={2.5} color="#10b981" style={{ position: 'absolute', top: -10, right: -10, opacity: 0.7 }} />
          <Plus size={20} strokeWidth={2.5} color="#10b981" style={{ position: 'absolute', bottom: -10, left: -10, opacity: 0.7 }} />
          <Plus size={20} strokeWidth={2.5} color="#10b981" style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.7 }} />

          <div style={{
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
            padding: isMobile ? '20px 16px' : '32px 40px',
            WebkitMaskImage: 'radial-gradient(600px 400px at center, white 30%, transparent 100%)',
            maskImage: 'radial-gradient(600px 400px at center, white 30%, transparent 100%)',
          }}>
            <h1 style={{
              fontSize: 'clamp(30px, 7vw, 72px)', fontWeight: 900,
              letterSpacing: isMobile ? '-1px' : '-2.5px',
              lineHeight: 1.05, margin: 0, color: '#f8fafc',
              textWrap: 'balance',
            } as React.CSSProperties}>
              La plataforma completa
              <br />
              para tu{' '}
              <span style={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 60%, #6ee7b7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                torneo.
              </span>
            </h1>

            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              <span style={{ position: 'relative', display: 'flex', width: 10, height: 10 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', opacity: 0.75, animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite' }} />
                <span style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'block' }} />
              </span>
              <p style={{ fontSize: 13, color: '#22c55e', margin: 0, fontWeight: 600 }}>Disponible ahora</p>
            </div>
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, margin: '0 auto 36px', maxWidth: 520, textWrap: 'pretty' } as React.CSSProperties}
        >
          Fútbol y fútbol sala. Fixture automático, vocalia en vivo,
          multas instantáneas y actas PDF enviadas por WhatsApp al delegado.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}
        >
          <Button size="lg" asChild>
            <a href="#cta" style={{ textDecoration: 'none' }}>
              Empezar gratis <ArrowRight size={16} style={{ marginLeft: 4 }} />
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#demo" style={{ textDecoration: 'none' }}>Ver demo en vivo</a>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 14, width: '100%', maxWidth: 520 }}
        >
          <StatCard value={120}  suffix="+" label="Torneos activos"     delay={0}   />
          <StatCard value={850}  suffix="+" label="Equipos registrados" delay={0.1} />
          <StatCard value={3200} suffix="+" label="Partidos jugados"    delay={0.2} />
        </motion.div>
      </div>

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>
    </section>
  );
}
