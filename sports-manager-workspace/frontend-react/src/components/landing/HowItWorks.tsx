import { motion } from 'framer-motion';
import { Trophy, Users, Shuffle, Radio, FileCheck } from 'lucide-react';

type Step = {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
};

const steps: Step[] = [
  {
    icon: Trophy,
    title: 'Creá el torneo',
    desc: 'Configurá nombre, deporte, formato de fixture, tamaño de plantilla y montos de multas por tarjeta.',
    color: '#10b981',
  },
  {
    icon: Users,
    title: 'Inscribí equipos y jugadores',
    desc: 'Cargá los equipos con sus delegados y los jugadores de cada plantilla. El sistema calcula el límite automáticamente.',
    color: '#3b82f6',
  },
  {
    icon: Shuffle,
    title: 'Generá el fixture',
    desc: 'Con un click se genera el calendario completo — Round Robin, eliminación directa o grupos + playoffs.',
    color: '#8b5cf6',
  },
  {
    icon: Radio,
    title: 'Dirigí en vivo con Vocalia',
    desc: 'Conectate al partido desde cualquier dispositivo. Goles, tarjetas y sustituciones en tiempo real con cronómetro del servidor.',
    color: '#f59e0b',
  },
  {
    icon: FileCheck,
    title: 'Acta y multas automáticas',
    desc: 'Al cerrar el partido se genera el acta en PDF y se envía por WhatsApp. Las multas se crean solas para que el delegado las pague.',
    color: '#ec4899',
  },
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function HowItWorks() {
  return (
    <section
      id="how"
      style={{
        padding: '120px 24px',
        background: 'rgba(255,255,255,0.01)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 900,
          height: 900,
          background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: 'center', marginBottom: 80 }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 100,
              padding: '5px 14px',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: '#34d399',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Cómo funciona
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 50px)',
              fontWeight: 800,
              letterSpacing: '-1.8px',
              margin: '0 0 16px',
              color: '#f8fafc',
              textWrap: 'balance',
            } as React.CSSProperties}
          >
            De cero a partido en{' '}
            <span style={{ color: '#10b981' }}>minutos</span>
          </h2>
          <p
            style={{
              color: '#64748b',
              fontSize: 16,
              lineHeight: 1.75,
              maxWidth: 460,
              margin: '0 auto',
              textWrap: 'pretty',
            } as React.CSSProperties}
          >
            Cinco pasos para tener tu torneo funcionando. Sin tecnicismos, sin configuraciones complejas.
          </p>
        </motion.div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;
            const rgb = hexToRgb(step.color);

            return (
              <div
                key={step.title}
                style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative' }}
              >
                {/* Left column: number + icon + connector */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                    width: 56,
                  }}
                >
                  {/* Step number badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      delay: i * 0.12,
                      duration: 0.45,
                      type: 'spring',
                      bounce: 0.3,
                    }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: `rgba(${rgb}, 0.1)`,
                      border: `1px solid rgba(${rgb}, 0.28)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 1,
                      flexShrink: 0,
                      /* Layered shadow for depth */
                      boxShadow: `0 0 0 6px rgba(${rgb},0.04), 0 4px 16px rgba(0,0,0,0.2)`,
                    }}
                  >
                    <Icon size={22} color={step.color} />
                  </motion.div>

                  {/* Animated connector line — draws itself downward */}
                  {!isLast && (
                    <motion.div
                      initial={{ scaleY: 0, opacity: 0 }}
                      whileInView={{ scaleY: 1, opacity: 1 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{
                        scaleY: { duration: 0.7, delay: i * 0.12 + 0.3, ease: 'easeInOut' },
                        opacity: { duration: 0.3, delay: i * 0.12 + 0.3 },
                      }}
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 48,
                        marginTop: 6,
                        marginBottom: 6,
                        background: `linear-gradient(to bottom, rgba(${rgb},0.5), rgba(${hexToRgb(steps[i + 1].color)},0.15))`,
                        borderRadius: 2,
                        transformOrigin: 'top',
                      }}
                    />
                  )}
                </div>

                {/* Right column: content card */}
                <motion.div
                  initial={{ opacity: 0, x: 32, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.12 + 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 18,
                    padding: '20px 24px',
                    marginBottom: isLast ? 0 : 16,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle color accent on the left edge */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 16,
                      bottom: 16,
                      width: 3,
                      borderRadius: 2,
                      background: `linear-gradient(to bottom, ${step.color}, transparent)`,
                      opacity: 0.5,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                      paddingLeft: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: step.color,
                        background: `rgba(${rgb}, 0.1)`,
                        padding: '2px 9px',
                        borderRadius: 100,
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Paso {i + 1}
                    </span>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#f1f5f9',
                        margin: 0,
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#64748b',
                      lineHeight: 1.75,
                      margin: 0,
                      paddingLeft: 8,
                      textWrap: 'pretty',
                    } as React.CSSProperties}
                  >
                    {step.desc}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
