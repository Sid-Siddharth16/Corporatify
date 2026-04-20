import './navbar.scss';
import ThemeToggle from '../theme-toggle';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { clearSession } from '../../pages/login/service/authService';
import { logout } from '../../pages/login/slice';

/**
 * Displays top-level dashboard navigation and global sign-out action.
 * @returns Dashboard navbar with Corporatify branding, tagline, and logout button.
 */
function Navbar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // Reads user name directly from Redux so navbar always shows current session owner.
  const userName = useAppSelector((state) => state.auth.user?.name ?? 'User');

  /**
   * Handles logout by clearing persisted storage and Redux state before redirect.
   */
  const handleLogout = () => {
    clearSession();
    dispatch(logout());
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar__brand-block">
        <p className="dashboard-navbar__brand">Corporatify</p>
        <p className="dashboard-navbar__tagline">Turn your thoughts into corporate language 💼</p>
      </div>
      <div className="dashboard-navbar__actions">
        {/* Shows who is currently signed in to avoid account confusion on shared devices. */}
        <span className="dashboard-navbar__user">Hi, {userName}</span>
        {/* Gives users direct control over light/dark mode from the header. */}
        <ThemeToggle />
        <button type="button" className="dashboard-navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
