import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { exchangeHandshake } from './api/auth.api';
import LandingPage from './pages/LandingPage';
import LeagueLandingPage from './pages/LeagueLandingPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import PlatformLayout from './components/layout/PlatformLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import SuperAdminRoute from './components/common/SuperAdminRoute';
import PlatformRoute from './components/common/PlatformRoute';
import DashboardPage from './pages/admin/DashboardPage';
import TournamentsPage from './pages/admin/TournamentsPage';
import TournamentDetailPage from './pages/admin/TournamentDetailPage';
import VocaliaPage from './pages/admin/VocaliaPage';
import MatchesPage from './pages/admin/MatchesPage';
import TeamsPage from './pages/admin/TeamsPage';
import FinesPage from './pages/admin/FinesPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import UsersPage from './pages/admin/UsersPage';
import LeaguesManagementPage from './pages/platform/LeaguesManagementPage';
import CreateLeaguePage from './pages/admin/CreateLeaguePage';
import PublicPortalPage from './pages/public/PublicPortalPage';
import PublicTournamentPage from './pages/public/PublicTournamentPage';
import PublicTeamPage from './pages/public/PublicTeamPage';
import PublicPlayerPage from './pages/public/PublicPlayerPage';
import { useAuthStore } from './store/auth.store';

// ---- League context -------------------------------------------------------
// Detects the current league slug from subdomain or ?league= query param.
// The context does NOT fetch from the API — subdomain resolution is server-side.

interface LeagueContextValue {
  slug: string | null;
}

const LeagueContext = createContext<LeagueContextValue>({ slug: null });

function detectSlug(): string | null {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    return params.get('league');
  }
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN as string | undefined;
  const baseParts = baseDomain ? baseDomain.split('.').length : 2;
  const parts = hostname.split('.');
  if (parts.length > baseParts) return parts[0];
  return null;
}

export function useLeague(): LeagueContextValue {
  return useContext(LeagueContext);
}

// ---- App ------------------------------------------------------------------
export default function App() {
  const slug = useMemo(() => detectSlug(), []);
  const login = useAuthStore((s) => s.login);
  const setActiveLeagueId = useAuthStore((s) => s.setActiveLeagueId);
  const navigate = useNavigate();
  const [handshaking, setHandshaking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('handshake');
    if (!token) return;

    setHandshaking(true);
    exchangeHandshake(token)
      .then((data) => {
        login(data.user, data.access_token);
        setActiveLeagueId(data.user.leagueId);
        window.history.replaceState({}, '', '/admin');
        navigate('/admin', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      })
      .finally(() => {
        setHandshaking(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (handshaking) return null;

  return (
    <LeagueContext.Provider value={{ slug }}>
      <Routes>
        <Route path="/" element={slug ? <LeagueLandingPage /> : <LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Public portal — no auth required */}
        <Route path="/portal" element={<PublicPortalPage />} />
        <Route path="/portal/:slug" element={<PublicTournamentPage />} />
        <Route path="/portal/:slug/equipos/:teamId" element={<PublicTeamPage />} />
        <Route path="/portal/:slug/equipos/:teamId/jugadores/:playerId" element={<PublicPlayerPage />} />

        {/* Standalone vocalia panel — opens in new window, no AdminLayout */}
        <Route
          path="/admin/vocalia/:matchId"
          element={
            <ProtectedRoute>
              <VocaliaPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect old /admin/leagues path to /platform */}
        <Route path="/admin/leagues" element={<Navigate to="/platform" replace />} />

        {/* PLATFORM_ADMIN routes — PlatformLayout, no sidebar */}
        <Route
          path="/platform"
          element={
            <PlatformRoute>
              <PlatformLayout />
            </PlatformRoute>
          }
        >
          <Route index element={<LeaguesManagementPage />} />
          <Route path="leagues/new" element={<CreateLeaguePage />} />
        </Route>

        {/* League admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="matches" element={<MatchesPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="fines" element={<FinesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="users" element={<SuperAdminRoute><UsersPage /></SuperAdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LeagueContext.Provider>
  );
}
