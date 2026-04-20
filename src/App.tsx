import { useEffect, useMemo, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/login';
import DashboardPage from './pages/dashboard';
import type { GoogleUserProfile } from './pages/login/helper';

/**
 * Persists authenticated Google profile between page reloads.
 */
const AUTH_STORAGE_KEY = 'corporatify_google_user';

/**
 * Reads Google user data from localStorage safely.
 * @returns Parsed Google profile when available, otherwise null.
 */
const readStoredGoogleUser = (): GoogleUserProfile | null => {
  try {
    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawUser) {
      return null;
    }
    return JSON.parse(rawUser) as GoogleUserProfile;
  } catch {
    return null;
  }
};

function App() {
  // Tracks current path so this app can switch views without adding extra routing dependencies.
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  // Keeps Google-authenticated profile globally available for both login and dashboard views.
  const [authenticatedUser, setAuthenticatedUser] = useState<GoogleUserProfile | null>(() => readStoredGoogleUser());
  const normalizedPath = useMemo(() => (currentPath === '/dashboard' ? '/dashboard' : '/'), [currentPath]);

  /**
   * Updates browser history and reactive route state together.
   * @param path Path to render after navigation.
   * @param replace Whether to replace current history entry instead of pushing.
   */
  const navigate = (path: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  /**
   * Stores authenticated profile and redirects user to dashboard.
   * @param userProfile Verified Google profile from successful identity callback.
   */
  const handleGoogleLoginSuccess = (userProfile: GoogleUserProfile) => {
    setAuthenticatedUser(userProfile);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
    navigate('/dashboard', true);
  };

  /**
   * Clears auth session and returns user to login route.
   */
  const handleLogout = () => {
    setAuthenticatedUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    navigate('/', true);
  };

  useEffect(() => {
    // Syncs view when user uses browser back/forward buttons.
    const syncPathFromBrowser = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', syncPathFromBrowser);
    return () => window.removeEventListener('popstate', syncPathFromBrowser);
  }, []);

  useEffect(() => {
    // Protects dashboard route from unauthenticated access and prevents signed-in users from returning to login.
    if (normalizedPath === '/dashboard' && !authenticatedUser) {
      navigate('/', true);
      return;
    }
    if (normalizedPath === '/' && authenticatedUser) {
      navigate('/dashboard', true);
    }
  }, [authenticatedUser, normalizedPath]);

  // Uses direct Google Identity Services integration in the login module to avoid provider/runtime conflicts.
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {normalizedPath === '/dashboard' && authenticatedUser ? (
        <DashboardPage user={authenticatedUser} onLogout={handleLogout} />
      ) : (
        <Login onGoogleLoginSuccess={handleGoogleLoginSuccess} />
      )}
    </GoogleOAuthProvider>
  );
}

export default App;