import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, CURRENT_LEGAL_VERSION } from '../../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, profile, violations } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const activeSuspension = violations?.find(v => v.violation_level >= 3 && (!v.expires_at || new Date(v.expires_at) > new Date()));
  if (activeSuspension && location.pathname !== '/suspended') {
    return <Navigate to="/suspended" replace />;
  }

  if (profile && profile.legal_accepted_version !== CURRENT_LEGAL_VERSION && location.pathname !== '/legal-acceptance') {
    return <Navigate to="/legal-acceptance" replace />;
  }

  const unacknowledgedWarning = violations?.find(v => !v.acknowledged && v.violation_level < 3);
  if (unacknowledgedWarning && location.pathname !== '/moderation-notice') {
    return <Navigate to="/moderation-notice" replace />;
  }

  // Allow chimera, ecosystem, and whisprr access levels
  if (profile && profile.access_level !== 'chimera' && profile.access_level !== 'ecosystem' && profile.access_level !== 'whisprr') {
    return <Navigate to="/restricted" replace />;
  }

  if (profile && !profile.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
