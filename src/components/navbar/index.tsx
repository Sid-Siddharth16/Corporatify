import './navbar.scss';
import ThemeToggle from '../theme-toggle';

type NavbarProps = {
  userName: string;
  onLogout: () => void;
};

/**
 * Displays top-level dashboard navigation and sign-out action.
 * @param userName Authenticated user name shown as context in the navbar action area.
 * @param onLogout Callback that clears auth state and returns user to login.
 * @returns Dashboard navbar with Corporatify branding, tagline, and logout button.
 */
function Navbar({ userName, onLogout }: NavbarProps) {
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
        <button type="button" className="dashboard-navbar__logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
