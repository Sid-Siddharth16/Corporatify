import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

/**
 * Blocks auth pages when user is already authenticated.
 * @returns Child routes for guests or redirect to dashboard for signed-in users.
 */
function PublicRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export default PublicRoute;
