import Navbar from '../../components/navbar';
import type { GoogleUserProfile } from '../login/helper';
import Home from './Home';
import './dashboard.scss';

type DashboardPageProps = {
  user: GoogleUserProfile | null;
  onLogout: () => void;
};

/**
 * Renders the authenticated dashboard shell after successful login.
 * @param user Authenticated Google profile used for personalized messaging context or null if not authenticated.
 * @param onLogout Callback invoked when user chooses to sign out.
 * @returns Corporatify workspace with split input/output conversion experience.
 */
function DashboardPage({ user, onLogout }: DashboardPageProps) {
  return (
    <main className="dashboard-page">
      {/* Uses a fallback name so navbar rendering remains safe even if user data is temporarily unavailable. */}
      <Navbar userName={user?.name ?? 'User'} onLogout={onLogout} />
      <Home />
    </main>
  );
}

export default DashboardPage;
