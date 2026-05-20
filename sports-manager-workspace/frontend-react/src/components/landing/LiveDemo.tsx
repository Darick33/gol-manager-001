import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Clock, Target, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';

type MatchEvent = {
  id: number;
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  team: 'home' | 'away';
  player: string;
};

const EVENTS_SEQUENCE: MatchEvent[] = [
  { id: 1, minute: 8,  type: 'GOAL',        team: 'home', player: 'M. García' },
  { id: 2, minute: 23, type: 'YELLOW_CARD', team: 'away', player: 'L. Torres' },
  { id: 3, minute: 34, type: 'GOAL',        team: 'away', player: 'R. Díaz' },
  { id: 4, minute: 41, type: 'GOAL',        team: 'home', player: 'C. López' },
  { id: 5, minute: 45, type: 'RED_CARD',    team: 'away', player: 'A. Martínez' },
];

const TOTAL_MINUTES = 45;

function EventBadge({ type }: { type: MatchEvent['type'] }) {
  const map = {
    GOAL:        { icon: <Target size={13} />,     label: 'Gol',      bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.22)',  color: '#10b981' },
    YELLOW_CARD: { icon: <ShieldAlert size={13} />, label: 'Amarilla', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.2)',   color: '#f59e0b' },
    RED_CARD:    { icon: <ShieldAlert size={13} />, label: 'Roja',     bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)',    color: '#ef4444' },
  };
  const t = map[type];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 8,
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {t.icon}
      {t.label}
    </span>
  );
}

export default function LiveDemo() {
  const isMobile = useIsMobile();
  const [seconds, setSeconds] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [running, setRunning] = useState(false);

  const homeScore = events.filter((e) => e.type === 'GOAL' && e.team === 'home').length;
  const awayScore = events.filter((e) => e.type === 'GOAL' && e.team === 'away').length;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        const minute = Math.floor(next / 2);
        const nextEvent = EVENTS_SEQUENCE.find(
          (e) => e.minute === minute && !events.some((ev) => ev.id === e.id),
        );
        if (nextEvent) setEvents((prev) => [nextEvent, ...prev]);
        if (next >= TOTAL_MINUTES * 2) {
          clearInterval(interval);
          setRunning(false);
        }
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [running, events]);

  const minute = Math.floor(seconds / 2);
  const progressPct = Math.min((minute / TOTAL_MINUTES) * 100, 100);

  const restart = () => {
    setSeconds(0);
    setEvents([]);
    setRunning(true);
  };

  return (
    <section
      id="demo"
      style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Purple ambient glow on the left */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-5%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: 'center', marginBottom: 56 }}
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
              Demo en vivo
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
            Así se ve{' '}
            <span style={{ color: '#10b981' }}>Vocalia</span>
          </h2>
          <p
            style={{
              color: '#64748b',
              fontSize: 16,
              lineHeight: 1.75,
              textWrap: 'pretty',
            } as React.CSSProperties}
          >
            Simulación interactiva del panel en tiempo real durante un partido.
          </p>
        </motion.div>

        {/* Scoreboard card */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${running ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 24,
            overflow: 'hidden',
            /* Only transition the border-color */
            transition: 'border-color 0.4s ease',
            boxShadow: running
              ? '0 0 60px rgba(16,185,129,0.06), 0 20px 60px rgba(0,0,0,0.3)'
              : '0 20px 60px rgba(0,0,0,0.2)',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Live dot — CSS animation, not framer, so it doesn't interrupt */}
              <span
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  width: 8,
                  height: 8,
                }}
              >
                {running && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: '#10b981',
                      opacity: 0.6,
                      animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
                    }}
                  />
                )}
                <span
                  style={{
                    position: 'relative',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: running ? '#10b981' : '#475569',
                    display: 'block',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              </span>
              <span style={{ fontSize: 13, color: running ? '#94a3b8' : '#475569', fontWeight: 600 }}>
                {running ? 'En vivo · Vocalia' : 'Vocalia Demo'}
              </span>
            </div>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color="#475569" />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: running ? '#10b981' : '#475569',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s ease',
                }}
              >
                {String(minute).padStart(2, '0')}:{String((seconds % 2) * 30).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>
                / {String(TOTAL_MINUTES).padStart(2, '0')}:00
              </span>
            </div>
          </div>

          {/* Match progress bar */}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.04)' }}>
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(to right, #10b981, #34d399)',
                boxShadow: '0 0 8px rgba(16,185,129,0.5)',
              }}
            />
          </div>

          {/* Score area */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              padding: isMobile ? '24px 16px' : '36px 48px',
              alignItems: 'center',
              gap: 0,
            }}
          >
            {/* Home team */}
            <motion.div
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.22)',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  /* Subtle outline on emoji container */
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                🦅
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Águilas FC</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 3, fontWeight: 500 }}>Local</div>
            </motion.div>

            {/* Score */}
            <div style={{ textAlign: 'center', padding: isMobile ? '0 12px' : '0 40px' }}>
              <motion.div
                key={`${homeScore}-${awayScore}`}
                initial={{ scale: 1.3, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 8 : 14,
                  fontSize: isMobile ? 44 : 60,
                  fontWeight: 900,
                  letterSpacing: '-3px',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span
                  style={{
                    color: homeScore > awayScore ? '#10b981' : '#f8fafc',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {homeScore}
                </span>
                <span style={{ color: '#1e293b', fontSize: 40 }}>:</span>
                <span
                  style={{
                    color: awayScore > homeScore ? '#10b981' : '#f8fafc',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {awayScore}
                </span>
              </motion.div>
              <div
                style={{
                  fontSize: 12,
                  color: '#334155',
                  marginTop: 10,
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                {running ? '1° Tiempo' : seconds === 0 ? 'Por comenzar' : 'Finalizado'}
              </div>
            </div>

            {/* Away team */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.22)',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                🐅
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Tigres SC</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 3, fontWeight: 500 }}>Visitante</div>
            </div>
          </div>

          {/* Events feed */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              minHeight: 196,
              maxHeight: 230,
              overflowY: 'auto',
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#334155',
                fontWeight: 700,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Eventos del partido
            </div>

            <AnimatePresence initial={false}>
              {events.length === 0 && (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    color: '#1e293b',
                    fontSize: 14,
                    textAlign: 'center',
                    paddingTop: 40,
                    margin: 0,
                  }}
                >
                  {seconds === 0
                    ? 'Presioná el botón para ver Vocalia en acción ↓'
                    : 'Esperando eventos...'}
                </motion.p>
              )}

              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    marginBottom: 8,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 28,
                    }}
                  >
                    {event.minute}'
                  </span>
                  <EventBadge type={event.type} />
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{event.player}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      marginLeft: 'auto',
                      fontWeight: 500,
                    }}
                  >
                    {event.team === 'home' ? 'Águilas' : 'Tigres'}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <Button
              onClick={restart}
              disabled={running}
              variant={running ? 'outline' : 'default'}
              size="default"
            >
              {running
                ? '⏱  Partido en curso...'
                : seconds > 0
                ? '↺  Reiniciar simulación'
                : '▶  Simular partido'}
            </Button>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
