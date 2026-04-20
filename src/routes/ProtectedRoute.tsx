import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

/**
 * Protects app routes that require an authenticated user session.
 * @returns Child routes for signed-in users or redirect to login when unauthenticated.
 */
function ProtectedRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
