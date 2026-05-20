import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [is, setIs] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const handler = () => setIs(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return is;
}
