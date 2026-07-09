import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, profile } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If the user has no profile or has not completed onboarding, only allow them to access the onboarding page.
  // We don't want to redirect them to /onboarding if they're already on it.
  if ((!profile || !profile.onboarding_complete) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Prevent NEXA-only accounts from accessing WHISPRR
  if (profile && profile.access_level === 'nexa') {
    return <Navigate to="/restricted" replace />;
  }

  return <Outlet />;
}
