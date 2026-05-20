import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardPage from './pages/admin/DashboardPage';
import TournamentsPage from './pages/admin/TournamentsPage';
import TournamentDetailPage from './pages/admin/TournamentDetailPage';
import VocaliaPage from './pages/admin/VocaliaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Standalone vocalia panel — opens in new window, no AdminLayout */}
      <Route
        path="/admin/vocalia/:matchId"
        element={
          <ProtectedRoute>
            <VocaliaPage />
          </ProtectedRoute>
        }
      />

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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
