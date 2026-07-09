import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function PublicOnlyRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    // If the user is logged in, redirect them away from the auth page.
    // If they came from a specific page, we redirect them back there.
    // Otherwise, redirect to the feed (/).
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
