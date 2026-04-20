import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import DashboardPage from './pages/dashboard';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import { getPersistedSession } from './pages/login/service/authService';
import { hydrateSession } from './pages/login/slice';
import { useAppDispatch } from './redux/hooks';
import PrivateRoute from './routes/PrivateRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Root app shell that wires route guards and boot-time session hydration.
 * @returns Auth-aware route tree with global notifications.
 */
function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Restores saved session once at app start so users stay logged in across refreshes.
    dispatch(hydrateSession(getPersistedSession()));
  }, [dispatch]);

  return (
    <>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {/* Protected wrapper remains available for any future shared authenticated pages. */}
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Root path defaults to login for guests and is auto-redirected by PublicRoute for signed-in users. */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global toast container keeps auth feedback consistent across all pages. */}
      <ToastContainer position="top-right" autoClose={2300} newestOnTop theme="dark" />
    </>
  );
}

export default App;