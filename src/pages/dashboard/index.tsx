import Navbar from '../../components/navbar';
import Home from './Home';
import './dashboard.scss';

/**
 * Renders the authenticated dashboard shell after successful login.
 * @returns Corporatify workspace with split input/output conversion experience.
 */
function DashboardPage() {
  return (
    <main className="dashboard-page">
      {/* Navbar now reads user data and handles logout directly through Redux-auth state. */}
      <Navbar />
      <Home />
    </main>
  );
}

export default DashboardPage;
