import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  Radio, AlertTriangle, FileText, MessageCircle,
  Shuffle, Layers, Timer, Smartphone, CheckCircle,
} from 'lucide-react';

type Feature = {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  glow: string;
  span: 1 | 2;
};

const features: Feature[] = [
  {
    icon: Radio,
    title: 'Vocalia en tiempo real',
    desc: 'Controlá el partido desde el celular: goles, tarjetas, sustituciones y el cronómetro del servidor — todo sincronizado al instante en todos los dispositivos.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.18)',
    span: 2,
  },
  {
    icon: AlertTriangle,
    title: 'Multas automáticas',
    desc: 'Cada tarjeta amarilla o roja genera la multa configurada por el torneo y notifica al delegado por WhatsApp.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    span: 1,
  },
  {
    icon: FileText,
    title: 'Acta PDF instantánea',
    desc: 'Al cerrar el partido se genera el acta oficial en PDF y se envía automáticamente al delegado.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.15)',
    span: 1,
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp nativo',
    desc: 'Notificaciones reales vía WhatsApp usando Baileys — sin APIs de terceros, sin costos extra.',
    color: '#25d366',
    glow: 'rgba(37,211,102,0.12)',
    span: 1,
  },
  {
    icon: Shuffle,
    title: 'Fixture inteligente',
    desc: 'Round Robin, Eliminación Directa o Grupos + Eliminación. El fixture se genera en un click.',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.15)',
    span: 1,
  },
  {
    icon: Layers,
    title: 'Multi-deporte',
    desc: 'Fútbol y fútbol sala en el mismo sistema. Tiempo de partido y tamaño de plantilla configurables por torneo.',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.12)',
    span: 2,
  },
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ── Vocalia: timer ticking + live dot + button highlight cycle ───────────────
function VocaliaPreview() {
  const [secs, setSecs] = useState(23 * 60 + 47);
  const [activeBtn, setActiveBtn] = useState(-1);

  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { setActiveBtn(i % 4); i++; }, 1800);
    return () => clearInterval(t);
  }, []);

  const mm = Math.floor(secs / 60).toString().padStart(2, '0');
  const ss = (secs % 60).toString().padStart(2, '0');

  const btns = [
    { label: '⚽ Gol',     color: '#10b981' },
    { label: '🟨 Tarjeta', color: '#f59e0b' },
    { label: '🔄 Sust.',   color: '#3b82f6' },
    { label: '🟥 Roja',    color: '#ef4444' },
  ];

  return (
    <div style={{
      marginTop: 24, padding: '14px 16px', borderRadius: 14,
      background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }}
          />
          <Timer size={13} color="#10b981" />
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cronómetro servidor
          </span>
        </div>
        <motion.span
          key={ss}
          initial={{ opacity: 0.4, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          style={{ fontSize: 15, fontWeight: 800, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}
        >
          {mm}:{ss}
        </motion.span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {btns.map((btn, i) => (
          <span
            key={btn.label}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 8, fontWeight: 500,
              background: activeBtn === i ? `rgba(${hexToRgb(btn.color)},0.15)` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeBtn === i ? `rgba(${hexToRgb(btn.color)},0.4)` : 'rgba(255,255,255,0.08)'}`,
              color: activeBtn === i ? btn.color : '#64748b',
              transform: activeBtn === i ? 'scale(1.06)' : 'scale(1)',
              transition: 'all 0.3s ease',
              display: 'inline-block',
            }}
          >
            {btn.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Multas: yellow card event → multa generada (height-stable) ───────────────
function MultasPreview() {
  const [step, setStep] = useState(0);
  const t = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const run = () => {
      setStep(0);
      t.current = setTimeout(() => setStep(1), 600);
      t.current = setTimeout(() => setStep(2), 1500);
      t.current = setTimeout(run, 5000);
    };
    run();
    return () => clearTimeout(t.current);
  }, []);

  return (
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Row 1: card event — always rendered, opacity animated */}
      <motion.div
        animate={{ opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
          borderRadius: 11, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.16)',
        }}
      >
        {/* Mini yellow card shape */}
        <div style={{
          width: 16, height: 22, borderRadius: 3, background: '#f59e0b', flexShrink: 0,
          boxShadow: '0 2px 10px rgba(245,158,11,0.45)',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', lineHeight: 1.3 }}>Martínez · Equipo B</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>min 34 · Tarjeta amarilla</div>
        </div>
        <motion.div
          animate={{ scale: step >= 1 ? [1, 1.5, 1] : 0, opacity: step >= 1 ? 1 : 0 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }}
        />
      </motion.div>

      {/* Row 2: multa + WA — always rendered, opacity animated */}
      <motion.div
        animate={{ opacity: step >= 2 ? 1 : 0, x: step >= 2 ? 0 : -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 13px', borderRadius: 11,
          background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.14)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Smartphone size={13} color="#25d366" />
          <span style={{ fontSize: 12, color: '#64748b' }}>Multa generada · Delegado notificado</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#25d366', fontVariantNumeric: 'tabular-nums' }}>
          $15.000
        </span>
      </motion.div>
    </div>
  );
}

// ── Acta PDF: progress bar fill → checkmark → reset ──────────────────────────
function ActaPDFPreview() {
  const [cycle, setCycle] = useState(0);
  const [filling, setFilling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setFilling(false);
    setDone(false);
    const t1 = setTimeout(() => setFilling(true), 120);
    const t2 = setTimeout(() => setDone(true), 2300);
    const t3 = setTimeout(() => setCycle(c => c + 1), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [cycle]);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <FileText size={13} color="#8b5cf6" />
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Acta-partido-31.pdf</span>
          </div>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }}>
                <CheckCircle size={13} color="#10b981" />
              </motion.div>
            ) : (
              <motion.span key="pct" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 11, color: '#8b5cf6', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {filling ? '100%' : '0%'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div style={{ height: 4, borderRadius: 2, background: 'rgba(139,92,246,0.12)', overflow: 'hidden' }}>
          <div
            key={cycle}
            style={{
              height: '100%', background: '#8b5cf6', borderRadius: 2,
              width: filling ? '100%' : '0%',
              transition: filling ? 'width 2s ease-out' : 'none',
            }}
          />
        </div>

        {/* Always rendered — height reserved, only opacity animates */}
        <motion.div
          animate={{ opacity: done ? 1 : 0, y: done ? 0 : 4 }}
          transition={{ duration: 0.25 }}
          style={{ marginTop: 8, fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Smartphone size={11} color="#25d366" />
          Enviado a Juan Delegado · ahora
        </motion.div>
      </div>
    </div>
  );
}

// ── WhatsApp: mini chat UI — typing → reply, height-stable ───────────────────
function WhatsAppPreview() {
  const [phase, setPhase] = useState<'typing' | 'replied'>('typing');
  const t1 = useRef<ReturnType<typeof setTimeout>>();
  const t2 = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const cycle = () => {
      setPhase('typing');
      t1.current = setTimeout(() => setPhase('replied'), 2000);
      t2.current = setTimeout(cycle, 5500);
    };
    cycle();
    return () => { clearTimeout(t1.current); clearTimeout(t2.current); };
  }, []);

  return (
    <div style={{
      marginTop: 20, borderRadius: 12, overflow: 'hidden',
      background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.14)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 11px',
        background: 'rgba(37,211,102,0.09)',
        borderBottom: '1px solid rgba(37,211,102,0.1)',
      }}>
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#25d366', flexShrink: 0 }}
        />
        <span style={{ fontSize: 11, color: '#25d366', fontWeight: 600 }}>Baileys · Sin API de pago</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#334155' }}>ahora</span>
      </div>

      {/* Chat bubbles */}
      <div style={{ padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* Incoming — client question, always visible */}
        <div style={{
          alignSelf: 'flex-start',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px 12px 12px 12px',
          padding: '6px 10px', fontSize: 12, color: '#94a3b8', maxWidth: 190,
        }}>
          ¿Llegó el acta del partido?
        </div>

        {/* Bot response — fixed size, both states overlap via opacity */}
        <div style={{
          alignSelf: 'flex-end', position: 'relative',
          width: 164, height: 30,
          background: 'rgba(37,211,102,0.13)', border: '1px solid rgba(37,211,102,0.22)',
          borderRadius: '12px 4px 12px 12px',
        }}>
          {/* Typing dots */}
          <motion.div
            animate={{ opacity: phase === 'typing' ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', gap: 4, alignItems: 'center', padding: '0 12px' }}
          >
            {[0, 1, 2].map(i => (
              <motion.span key={i}
                animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                style={{ display: 'block', width: 6, height: 6, borderRadius: '50%', background: '#25d366' }}
              />
            ))}
          </motion.div>
          {/* Reply text */}
          <motion.div
            animate={{ opacity: phase === 'replied' ? 1 : 0, y: phase === 'replied' ? 0 : 3 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              padding: '0 10px', fontSize: 12, color: '#25d366', fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Acta enviada al delegado
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Fixture: matchups appearing one by one → reset ───────────────────────────
function FixturePreview() {
  const [shown, setShown] = useState(0);
  const t = useRef<ReturnType<typeof setTimeout>>();

  const matches = [
    { home: 'Halcones', away: 'Dragones', score: '2 - 1', done: true },
    { home: 'Leones',   away: 'Águilas',  score: 'vs',    done: false },
    { home: 'Tigres',   away: 'Lobos',    score: 'vs',    done: false },
  ];

  useEffect(() => {
    const step = (n: number) => {
      setShown(n);
      if (n < matches.length) {
        t.current = setTimeout(() => step(n + 1), 520);
      } else {
        t.current = setTimeout(() => {
          setShown(0);
          t.current = setTimeout(() => step(1), 450);
        }, 3200);
      }
    };
    t.current = setTimeout(() => step(1), 700);
    return () => clearTimeout(t.current);
  }, []);

  return (
    /* All rows always rendered — height stays constant, only opacity/x animate */
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {matches.map((m, i) => (
        <motion.div
          key={i}
          animate={{ opacity: shown > i ? 1 : 0, x: shown > i ? 0 : -14 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 12px', borderRadius: 10,
            background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)',
          }}
        >
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{m.home}</span>
          <span style={{
            fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: m.done ? '#3b82f6' : '#334155',
          }}>
            {m.score}
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{m.away}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Sport: alternating active glow ───────────────────────────────────────────
function SportPreview() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => 1 - a), 2600);
    return () => clearInterval(t);
  }, []);

  const sports = [
    { emoji: '⚽', name: 'Fútbol',      detail: '45 min × 2 tiempos', color: '#10b981' },
    { emoji: '🏟️', name: 'Fútbol Sala', detail: '20 min × 2 tiempos', color: '#ec4899' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
      {sports.map((s, i) => (
        <div key={s.name} style={{
          flex: 1, padding: '12px 14px', borderRadius: 14,
          background: active === i ? `rgba(${hexToRgb(s.color)},0.09)` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${active === i ? `rgba(${hexToRgb(s.color)},0.28)` : `rgba(${hexToRgb(s.color)},0.08)`}`,
          transition: 'all 0.5s ease',
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
          <div style={{
            fontSize: 13, fontWeight: 700, marginBottom: 2,
            color: active === i ? '#f1f5f9' : '#64748b',
            transition: 'color 0.5s ease',
          }}>
            {s.name}
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>{s.detail}</div>
        </div>
      ))}
    </div>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ f, index, compact }: { f: Feature; index: number; compact?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(f.color);
  const Icon = f.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.09, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        gridColumn: compact ? 'span 1' : `span ${f.span}`,
        background: hovered ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? `rgba(${rgb},0.28)` : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        padding: compact ? 20 : 28,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', top: 0, right: 0, width: 260, height: 260,
          background: `radial-gradient(circle at top right, ${f.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: 180, height: 180,
        background: `radial-gradient(circle at bottom left, rgba(${rgb},0.05) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <motion.div
        animate={{ boxShadow: hovered ? `0 0 20px rgba(${rgb},0.3)` : `0 0 0px rgba(${rgb},0)` }}
        transition={{ duration: 0.3 }}
        style={{
          width: 46, height: 46, borderRadius: 13,
          background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.22)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}
      >
        <motion.div animate={{ scale: hovered ? 1.12 : 1 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }}>
          <Icon size={20} color={f.color} />
        </motion.div>
      </motion.div>

      <h3 style={{
        fontSize: f.span === 2 ? 20 : 17, fontWeight: 700, color: '#f1f5f9',
        margin: '0 0 10px', letterSpacing: '-0.4px', textWrap: 'balance',
      } as React.CSSProperties}>
        {f.title}
      </h3>
      <p style={{
        fontSize: 14, color: '#64748b', lineHeight: 1.75, margin: 0, textWrap: 'pretty',
      } as React.CSSProperties}>
        {f.desc}
      </p>

      {f.title === 'Vocalia en tiempo real' && <VocaliaPreview />}
      {f.title === 'Multas automáticas'    && <MultasPreview />}
      {f.title === 'Acta PDF instantánea'  && <ActaPDFPreview />}
      {f.title === 'WhatsApp nativo'       && <WhatsAppPreview />}
      {f.title === 'Fixture inteligente'   && <FixturePreview />}
      {f.title === 'Multi-deporte'         && <SportPreview />}
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Features() {
  const isMobile = useIsMobile(640);
  const isSmallDesktop = useIsMobile(1024);
  const columns = isMobile ? 1 : isSmallDesktop ? 2 : 4;

  return (
    <section id="features" style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '30%', right: '-10%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Funcionalidades
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 800, letterSpacing: '-1.8px',
            margin: '0 0 16px', color: '#f8fafc', textWrap: 'balance',
          } as React.CSSProperties}>
            Todo lo que necesitás,{' '}
            <span style={{ color: '#10b981' }}>sin complicaciones</span>
          </h2>
          <p style={{
            color: '#64748b', fontSize: 16, maxWidth: 500, margin: '0 auto',
            lineHeight: 1.75, textWrap: 'pretty',
          } as React.CSSProperties}>
            Diseñado para árbitros, vocales y administradores de torneos amateurs y semiprofesionales.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: isMobile ? 12 : 16,
        }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} index={i} compact={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}
