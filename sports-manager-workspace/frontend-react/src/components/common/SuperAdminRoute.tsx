import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'PLATFORM_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
