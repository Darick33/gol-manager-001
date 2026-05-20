import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Button } from '../ui/button';

const PARTICLES = [
  { x: '12%', delay: 0,   duration: 4.0, size: 3 },
  { x: '28%', delay: 0.7, duration: 3.5, size: 2 },
  { x: '42%', delay: 1.4, duration: 5.0, size: 4 },
  { x: '58%', delay: 0.3, duration: 3.8, size: 2 },
  { x: '72%', delay: 1.1, duration: 4.5, size: 3 },
  { x: '88%', delay: 0.9, duration: 3.2, size: 2 },
];

const TRUST = [
  { label: 'Sin tarjeta de crédito' },
  { label: 'Setup en minutos' },
  { label: 'Soporte por WhatsApp' },
];

export default function CTA() {
  const isMobile = useIsMobile();

  return (
    <section
      id="cta"
      style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Main radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 600,
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating emerald particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -70], opacity: [0, 0.5, 0] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: p.x,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: '#10b981',
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: 680,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Glass card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(16,185,129,0.18)',
            borderRadius: 28,
            padding: isMobile ? '40px 24px' : '60px 48px',
            backdropFilter: 'blur(24px)',
            boxShadow:
              '0 0 80px rgba(16,185,129,0.07), 0 40px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.3, delay: 0.1 }}
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px',
              boxShadow:
                '0 0 0 8px rgba(16,185,129,0.08), 0 0 40px rgba(16,185,129,0.35)',
              fontSize: 30,
            }}
          >
            ⚽
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontSize: 'clamp(26px, 4vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-1.5px',
              margin: '0 0 16px',
              color: '#f8fafc',
              lineHeight: 1.1,
              textWrap: 'balance',
            } as React.CSSProperties}
          >
            ¿Listo para llevar tu torneo al siguiente nivel?
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              color: '#64748b',
              fontSize: 16,
              lineHeight: 1.75,
              margin: '0 auto 40px',
              maxWidth: 440,
              textWrap: 'pretty',
            } as React.CSSProperties}
          >
            Escribinos por WhatsApp y te ayudamos a configurar tu primer torneo.
            Sin costo inicial, sin burocracia.
          </motion.p>

          {/* CTAs — whileHover max 1.02, whileTap exactly 0.96 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Button size="lg" asChild>
                <a
                  href="https://wa.me/+5491100000000?text=Hola!%20Quiero%20saber%20más%20sobre%20GolManager"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <MessageCircle size={18} />
                  Contactar por WhatsApp
                </a>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="#features"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  Ver funcionalidades <ArrowRight size={15} />
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              display: 'flex',
              gap: 20,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 36,
              paddingTop: 28,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {TRUST.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={14} color="#10b981" />
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
