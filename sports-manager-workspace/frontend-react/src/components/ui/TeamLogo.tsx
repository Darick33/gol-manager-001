import { useState } from 'react';
import type { Team } from '../../types';

/**
 * Shared team logo component.
 * Renders the team logo image when available, falling back to a
 * color-accented initials avatar on load error or when no logo URL exists.
 */
export function TeamLogo({ team, size = 28 }: { team: Team | undefined; size?: number }) {
  const [imgError, setImgError] = useState(false);
  if (!team) return null;
  const primary = team.primaryColor ?? '#475569';
  return team.logoUrl && !imgError ? (
    <img
      src={team.logoUrl}
      alt={team.name}
      width={size}
      height={size}
      onError={() => setImgError(true)}
      style={{
        borderRadius: size * 0.28,
        objectFit: 'cover',
        border: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        flexShrink: 0,
        background: `linear-gradient(135deg, ${primary}55, ${primary}22)`,
        border: `1px solid ${primary}35`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.33,
        fontWeight: 800,
        color: primary,
      }}
    >
      {team.name.slice(0, 2).toUpperCase()}
    </div>
  );
}
