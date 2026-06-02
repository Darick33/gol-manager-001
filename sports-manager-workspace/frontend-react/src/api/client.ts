import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Detect current league slug from subdomain or query param
function detectLeagueSlug(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Subdomain format: {slug}.domain.com (3+ parts)
  if (parts.length > 2) {
    return parts[0];
  }

  // Localhost dev: ?league=slug
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    const league = params.get('league');
    if (league) return league;
  }

  return null;
}

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const { state } = JSON.parse(raw) as { state: { token: string | null } };
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // malformed storage — ignore
    }
  }

  // Inject league subdomain header if in a league context
  const slug = detectLeagueSlug();
  if (slug) {
    config.headers['X-League-Subdomain'] = slug;
  }

  return config;
});

// Auto-logout on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
