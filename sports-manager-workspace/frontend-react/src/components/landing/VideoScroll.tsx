import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, MotionValue } from 'framer-motion';
import { Shuffle, Radio, AlertTriangle, Trophy } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

// ─── helpers ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ].join(',');
}

function fade(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0]);
}

// ─── sub-components ─────────────────────────────────────────────────────────

function CornerBlock({
  style, opacity, dx, icon: Icon, color, label, sub,
}: {
  style: React.CSSProperties;
  opacity: MotionValue<number>;
  dx: MotionValue<number>;
  icon: React.ElementType;
  color: string;
  label: string;
  sub: string;
}) {
  const rgb = hexToRgb(color);
  return (
    <motion.div style={{ ...style, opacity, x: dx, pointerEvents: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: 'rgba(5,5,10,0.78)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 16, padding: '14px 18px',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        maxWidth: 230,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.4 }}>
            {sub}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({
  style, opacity, dx, value, label,
}: {
  style: React.CSSProperties;
  opacity: MotionValue<number>;
  dx: MotionValue<number>;
  value: string;
  label: string;
}) {
  return (
    <motion.div style={{ ...style, opacity, x: dx, pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(5,5,10,0.78)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 16, padding: '14px 22px', textAlign: 'center',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

const ABS: React.CSSProperties = { position: 'absolute', zIndex: 3 };

// Snap to the center of each text phase's peak visibility window, plus clean entry/exit
const SNAP_POINTS = [0, 0.14, 0.52, 0.70, 1.0];

export default function VideoScroll() {
  const containerRef   = useRef<HTMLDivElement>(null);
  const panelRef       = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const framesRef      = useRef<HTMLImageElement[]>([]);
  const progressRef    = useRef(0);          // current scroll 0-1 (no state, no re-render)
  const rafRef         = useRef<number>(0);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnappingRef  = useRef(false);

  const [loadPct, setLoadPct]   = useState(0);   // 0-1
  const [ready, setReady]       = useState(false);

  const scrollProgress = useMotionValue(0);       // drives framer-motion overlays
  const isMobile = useIsMobile();

  // ── Load all frames ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/frames/meta.json')
      .then(r => r.json())
      .then(({ frameCount }: { frameCount: number }) => {
        const imgs = new Array<HTMLImageElement>(frameCount);
        let done = 0;

        for (let i = 0; i < frameCount; i++) {
          const img = new Image();
          // Hint the browser this is a large decode — slightly faster first paint
          img.decoding = 'async';
          img.src = `/frames/frame_${String(i).padStart(4, '0')}.webp`;
          img.onload = () => {
            imgs[i] = img;
            done++;
            setLoadPct(done / frameCount);
            if (done === frameCount) {
              framesRef.current = imgs;
              setReady(true);
            }
          };
          img.onerror = () => { done++; };
        }
      })
      .catch(() => {});
  }, []);

  // ── Canvas: draw correct frame every rAF tick ─────────────────────────────
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx    = canvas?.getContext('2d');
      const frames = framesRef.current;

      if (canvas && ctx && frames.length > 0) {
        const p     = progressRef.current;
        const HOLD  = 0.18; // 18% of scroll held at first and last frame
        const animP = Math.max(0, Math.min(1, (p - HOLD) / (1 - 2 * HOLD)));
        const idx = Math.round(animP * (frames.length - 1));
        const img = frames[Math.max(0, Math.min(idx, frames.length - 1))];

        if (img?.complete && img.naturalWidth > 0) {
          const cw = canvas.width;
          const ch = canvas.height;
          // object-fit: cover math
          const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
          const dx    = (cw - img.naturalWidth  * scale) / 2;
          const dy    = (ch - img.naturalHeight * scale) / 2;
          ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Resize canvas to match viewport (physical pixels) ────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Scroll → panel positioning + progress + snap ─────────────────────────
  // Direct DOM manipulation: zero React re-renders on scroll.
  // Bypasses CSS sticky — works regardless of overflow on ancestors.
  useEffect(() => {
    const onScroll = () => {
      const container = containerRef.current;
      const panel     = panelRef.current;
      if (!container || !panel) return;

      const rect       = container.getBoundingClientRect();
      const vh         = window.innerHeight;
      const scrollable = container.offsetHeight - vh;
      const p          = Math.max(0, Math.min(1, -rect.top / scrollable));

      progressRef.current = p;
      scrollProgress.set(p);

      const isPinned = rect.top <= 0 && rect.bottom >= vh;

      if (isPinned) {
        panel.style.position = 'fixed';
        panel.style.top      = '0';
        panel.style.bottom   = '';
      } else if (rect.bottom < vh) {
        panel.style.position = 'absolute';
        panel.style.top      = '';
        panel.style.bottom   = '0';
      } else {
        panel.style.position = 'absolute';
        panel.style.top      = '0';
        panel.style.bottom   = '';
      }

      // Snap logic: debounce scroll end, then jump to nearest text phase
      if (isPinned && !isSnappingRef.current) {
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = setTimeout(() => {
          const c = containerRef.current;
          if (!c) return;
          const r2         = c.getBoundingClientRect();
          const vh2        = window.innerHeight;
          const scrollable2 = c.offsetHeight - vh2;
          if (!(r2.top <= 0 && r2.bottom >= vh2)) return; // left section during debounce

          const currentP = progressRef.current;
          const nearest  = SNAP_POINTS.reduce((a, b) =>
            Math.abs(b - currentP) < Math.abs(a - currentP) ? b : a,
          );
          const containerTop  = r2.top + window.scrollY;
          const targetScrollY = containerTop + nearest * scrollable2;

          if (Math.abs(targetScrollY - window.scrollY) > 4) {
            isSnappingRef.current = true;
            window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
            // Reset after smooth scroll completes (~700ms max for these distances)
            setTimeout(() => { isSnappingRef.current = false; }, 700);
          }
        }, 150);
      } else if (!isPinned) {
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    };
  }, [scrollProgress]);

  // ── Derived motion values (framer-motion, never re-computed per frame) ────
  const p = scrollProgress;

  const ph1Op = fade(p, 0,    0.08, 0.20, 0.30);
  const ph2Op = fade(p, 0.30, 0.38, 0.52, 0.62);
  const ph3Op = fade(p, 0.62, 0.70, 0.84, 0.94);
  const ph1Y  = useTransform(p, [0,    0.30], [28, -28]);
  const ph2Y  = useTransform(p, [0.30, 0.62], [28, -28]);
  const ph3Y  = useTransform(p, [0.62, 0.94], [28, -28]);

  const tlOp = fade(p, 0.26, 0.34, 0.54, 0.64);
  const trOp = fade(p, 0.28, 0.36, 0.54, 0.64);
  const blOp = fade(p, 0.60, 0.68, 0.84, 0.94);
  const brOp = fade(p, 0.62, 0.70, 0.84, 0.94);
  const tlX  = useTransform(p, [0.26, 0.64], [-14, 0]);
  const trX  = useTransform(p, [0.28, 0.64], [ 14, 0]);
  const blX  = useTransform(p, [0.60, 0.94], [-14, 0]);
  const brX  = useTransform(p, [0.62, 0.94], [ 14, 0]);
  const hintOp = useTransform(p, [0, 0.06], [1, 0]);

  const phases = [
    { op: ph1Op, y: ph1Y, eyebrow: 'Temporada 2026',        headline: 'Gestioná cada partido\ndesde el celular.' },
    { op: ph2Op, y: ph2Y, eyebrow: 'Fixture inteligente',    headline: 'Tu torneo armado\nen un click.'          },
    { op: ph3Op, y: ph3Y, eyebrow: 'La plataforma completa', headline: 'Todo en un solo\nlugar.'                 },
  ];

  return (
    <div ref={containerRef} style={{ height: '250vh', position: 'relative' }}>
      <div
        ref={panelRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh', overflow: 'hidden' }}
      >
        {/* ── Canvas: frame-accurate scroll playback ── */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        />

        {/* Dark tint over frames */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.45)',
        }} />

        {/* Loading overlay — fades out once ready */}
        {!ready && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: '#05050a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16,
          }}>
            <div style={{ width: 200, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{
                height: '100%', background: '#10b981', borderRadius: 2,
                width: `${loadPct * 100}%`,
                transition: 'width 0.2s ease',
              }} />
            </div>
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 500, letterSpacing: '0.5px' }}>
              Cargando escena...
            </span>
          </div>
        )}

        {/* Top/bottom edge fades into page bg */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, #05050a 0%, transparent 14%, transparent 86%, #05050a 100%)',
        }} />
        {/* Side darkening for corner legibility */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(5,5,10,0.65) 0%, transparent 24%, transparent 76%, rgba(5,5,10,0.65) 100%)',
        }} />

        {/* ── Center text phases ── */}
        {phases.map(({ op, y, eyebrow, headline }, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              opacity: op, y,
            }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
              borderRadius: 100, padding: '4px 13px', marginBottom: 18,
            }}>
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {eyebrow}
              </span>
            </div>
            <h2 style={{
              fontSize: 'clamp(30px, 5vw, 62px)', fontWeight: 900,
              letterSpacing: '-2px', lineHeight: 1.08,
              color: '#f8fafc', textAlign: 'center', margin: 0,
              whiteSpace: 'pre-line',
              textShadow: '0 2px 32px rgba(0,0,0,0.9)',
            } as React.CSSProperties}>
              {headline}
            </h2>
          </motion.div>
        ))}

        {/* ── Corners — hidden on mobile to avoid overlap ── */}
        {!isMobile && (
          <>
            <CornerBlock
              style={{ ...ABS, top: 80, left: 40 }} opacity={tlOp} dx={tlX}
              icon={Shuffle} color="#3b82f6"
              label="Fixture automático" sub="Round Robin · Eliminación · Grupos"
            />
            <StatPill
              style={{ ...ABS, top: 80, right: 40 }} opacity={trOp} dx={trX}
              value="120+" label="Torneos activos"
            />
            <CornerBlock
              style={{ ...ABS, bottom: 80, left: 40 }} opacity={blOp} dx={blX}
              icon={Radio} color="#10b981"
              label="Vocalia en vivo" sub="Sincronizado en todos los dispositivos"
            />
            <CornerBlock
              style={{ ...ABS, bottom: 80, right: 40 }} opacity={brOp} dx={brX}
              icon={AlertTriangle} color="#f59e0b"
              label="Multas automáticas" sub="Notificación por WhatsApp al instante"
            />
          </>
        )}

        {/* ── Scroll hint ── */}
        <motion.div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4, pointerEvents: 'none', opacity: hintOp,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <Trophy size={14} color="#10b981" />
          <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, rgba(16,185,129,0.6), transparent)' }} />
        </motion.div>
      </div>
    </div>
  );
}
