import { Trophy, Globe, Share2 } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const TAPE_COLOR = 'rgba(16,185,129,0.18)';
const TAPE_BORDER = 'rgba(16,185,129,0.35)';

function TapeSVG({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg
      width="48"
      height="20"
      viewBox="0 0 48 20"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)`, display: 'block' }}
    >
      <rect x="0.5" y="0.5" width="47" height="19" rx="3.5" fill={TAPE_COLOR} stroke={TAPE_BORDER} />
      <line x1="8" y1="0" x2="8" y2="20" stroke={TAPE_BORDER} strokeWidth="0.5" />
      <line x1="16" y1="0" x2="16" y2="20" stroke={TAPE_BORDER} strokeWidth="0.5" />
      <line x1="24" y1="0" x2="24" y2="20" stroke={TAPE_BORDER} strokeWidth="0.5" />
      <line x1="32" y1="0" x2="32" y2="20" stroke={TAPE_BORDER} strokeWidth="0.5" />
      <line x1="40" y1="0" x2="40" y2="20" stroke={TAPE_BORDER} strokeWidth="0.5" />
    </svg>
  );
}

const LINKS: Record<string, { label: string; href: string }[]> = {
  Producto: [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Cómo funciona', href: '#how' },
    { label: 'Demo en vivo', href: '#demo' },
    { label: 'Precios', href: '#pricing' },
  ],
  Recursos: [
    { label: 'Acta PDF', href: '#' },
    { label: 'Notificaciones WhatsApp', href: '#' },
    { label: 'Fixture inteligente', href: '#' },
    { label: 'Multas automáticas', href: '#' },
  ],
  Legal: [
    { label: 'Privacidad', href: '#' },
    { label: 'Términos', href: '#' },
    { label: 'Contacto', href: '#' },
  ],
};

const linkStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  textDecoration: 'none',
  fontWeight: 500,
  lineHeight: 1,
  transition: 'color 0.15s',
};

export default function Footer() {
  const isMobile = useIsMobile();

  return (
    <footer style={{ background: '#05050a', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Card ── */}
        <div style={{ position: 'relative' }}>

          {/* Corner tapes */}
          {!isMobile && (
            <>
              <div style={{ position: 'absolute', top: -10, left: 28, zIndex: 2 }}>
                <TapeSVG rotate={-3} />
              </div>
              <div style={{ position: 'absolute', top: -10, right: 28, zIndex: 2 }}>
                <TapeSVG rotate={3} />
              </div>
              <div style={{ position: 'absolute', bottom: -10, left: 28, zIndex: 2 }}>
                <TapeSVG rotate={2} />
              </div>
              <div style={{ position: 'absolute', bottom: -10, right: 28, zIndex: 2 }}>
                <TapeSVG rotate={-2} />
              </div>
            </>
          )}

          {/* Card body */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 24,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: isMobile ? '32px 20px 28px' : '48px 48px 40px',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
              gap: isMobile ? 32 : '40px 64px',
              alignItems: 'start',
            }}>

              {/* Brand column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                  }}>
                    <Trophy size={17} color="white" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 18, color: '#f8fafc', letterSpacing: '-0.5px' }}>
                    Gol<span style={{ color: '#10b981' }}>Manager</span>
                  </span>
                </div>
                <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 240 }}>
                  La plataforma completa para gestionar tu torneo de fútbol amateur desde el celular.
                </p>
                {/* Social */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {[
                    { icon: Globe, href: '#', label: 'Web' },
                    { icon: Share2, href: '#', label: 'Compartir' },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748b',
                        transition: 'border-color 0.15s, color 0.15s',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = 'rgba(16,185,129,0.4)';
                        el.style.color = '#10b981';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = 'rgba(255,255,255,0.08)';
                        el.style.color = '#64748b';
                      }}
                    >
                      <Icon size={15} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Nav columns */}
              <div style={{ display: 'flex', gap: isMobile ? 24 : 56, flexWrap: 'wrap' }}>
                {Object.entries(LINKS).map(([section, items]) => (
                  <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {section}
                    </span>
                    {items.map(({ label, href }) => (
                      <a
                        key={label}
                        href={href}
                        style={linkStyle}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                ))}
              </div>

            </div>

            {/* Divider + copyright */}
            <div style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <p style={{ color: '#334155', fontSize: 12, margin: 0 }}>
                © 2026 GolManager. Hecho con ❤️ para el fútbol amateur.
              </p>
              <p style={{ color: '#1e293b', fontSize: 12, margin: 0 }}>
                Argentina · Uruguay · Paraguay
              </p>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
