const PLUS_BG = [
  { x: '5%',  y: '14%', size: 48, op: 0.65, dur: 9,  delay: 0,   anim: 'floatA' },
  { x: '88%', y: '10%', size: 40, op: 0.70, dur: 11, delay: 2,   anim: 'floatB' },
  { x: '93%', y: '65%', size: 52, op: 0.60, dur: 13, delay: 1,   anim: 'floatA' },
  { x: '3%',  y: '76%', size: 44, op: 0.65, dur: 10, delay: 3.5, anim: 'floatB' },
  { x: '52%', y: '91%', size: 36, op: 0.55, dur: 12, delay: 1.5, anim: 'floatA' },
  { x: '14%', y: '52%', size: 32, op: 0.60, dur: 8,  delay: 4,   anim: 'floatB' },
  { x: '78%', y: '80%', size: 46, op: 0.62, dur: 14, delay: 0.5, anim: 'floatA' },
  { x: '64%', y: '4%',  size: 38, op: 0.68, dur: 10, delay: 2.5, anim: 'floatB' },
  { x: '22%', y: '7%',  size: 20, op: 0.80, dur: 7,  delay: 1,   anim: 'floatA' },
  { x: '74%', y: '30%', size: 18, op: 0.82, dur: 9,  delay: 3,   anim: 'floatB' },
  { x: '38%', y: '84%', size: 22, op: 0.72, dur: 11, delay: 0.8, anim: 'floatA' },
  { x: '58%', y: '70%', size: 16, op: 0.75, dur: 8,  delay: 2.2, anim: 'floatB' },
  { x: '83%', y: '46%', size: 20, op: 0.70, dur: 12, delay: 4.5, anim: 'floatA' },
  { x: '28%', y: '36%', size: 18, op: 0.65, dur: 9,  delay: 1.8, anim: 'floatB' },
  { x: '46%', y: '13%', size: 24, op: 0.68, dur: 10, delay: 3.5, anim: 'floatA' },
  { x: '10%', y: '91%', size: 18, op: 0.72, dur: 8,  delay: 0.3, anim: 'floatB' },
  { x: '68%', y: '55%', size: 16, op: 0.66, dur: 11, delay: 2.7, anim: 'floatA' },
  { x: '32%', y: '68%', size: 22, op: 0.62, dur: 9,  delay: 1.2, anim: 'floatB' },
];

const DOT_BG = [
  { x: '12%', y: '26%', size: 7, op: 0.75, dur: 6,  delay: 0   },
  { x: '85%', y: '56%', size: 6, op: 0.70, dur: 8,  delay: 1.5 },
  { x: '42%', y: '74%', size: 8, op: 0.65, dur: 9,  delay: 0.7 },
  { x: '68%', y: '20%', size: 7, op: 0.75, dur: 7,  delay: 2.8 },
  { x: '25%', y: '60%', size: 6, op: 0.68, dur: 10, delay: 1   },
  { x: '56%', y: '40%', size: 7, op: 0.65, dur: 8,  delay: 3.5 },
  { x: '78%', y: '86%', size: 6, op: 0.72, dur: 6,  delay: 0.5 },
  { x: '35%', y: '10%', size: 8, op: 0.70, dur: 11, delay: 2   },
  { x: '90%', y: '36%', size: 7, op: 0.72, dur: 7,  delay: 4   },
  { x: '18%', y: '80%', size: 6, op: 0.75, dur: 9,  delay: 1.3 },
  { x: '60%', y: '88%', size: 7, op: 0.65, dur: 8,  delay: 3   },
  { x: '8%',  y: '44%', size: 6, op: 0.72, dur: 10, delay: 2.5 },
];

export default function SectionParticleBg() {
  return (
    <>
      <style>{`
        @keyframes secFloatA {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes secFloatB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-13px) rotate(-5deg); }
        }
        @keyframes secPulseDot {
          0%, 100% { opacity: var(--dot-op); transform: scale(1); }
          50%       { opacity: calc(var(--dot-op) * 1.5); transform: scale(1.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sec-plus, .sec-dot { animation: none !important; }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>

        {/* Dot-grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Green glow — top and center */}
        <div style={{
          position: 'absolute',
          top: '20%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 900, height: 700,
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 55%, transparent 70%)',
        }} />

        {/* Floating "+" symbols */}
        {PLUS_BG.map((p, i) => (
          <div
            key={i}
            className="sec-plus"
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              opacity: p.op,
              color: i % 3 === 0 ? '#10b981' : 'rgba(255,255,255,0.9)',
              animation: `${p.anim === 'floatA' ? 'secFloatA' : 'secFloatB'} ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        ))}

        {/* Floating dots */}
        {DOT_BG.map((d, i) => (
          <div
            key={i}
            className="sec-dot"
            style={{
              position: 'absolute',
              left: d.x,
              top: d.y,
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#10b981' : 'rgba(255,255,255,0.8)',
              ['--dot-op' as string]: d.op,
              opacity: d.op,
              animation: `secPulseDot ${d.dur}s ease-in-out ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}
