import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

/**
 * Private route wrapper reserved for strictly authenticated pages.
 * Uses same guard as protected route today, while keeping extension point explicit.
 * @returns Private children for signed-in users or login redirect for guests.
 */
function PrivateRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
