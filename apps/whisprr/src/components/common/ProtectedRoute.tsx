import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, CURRENT_LEGAL_VERSION } from '../../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, profile, violations } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Gate 1: Active Suspensions
  const activeSuspension = violations?.find(v => v.violation_level >= 3 && (!v.expires_at || new Date(v.expires_at) > new Date()));
  if (activeSuspension && location.pathname !== '/suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Gate 2: Legal Acceptance
  if (profile && profile.legal_accepted_version !== CURRENT_LEGAL_VERSION && location.pathname !== '/legal-acceptance') {
    return <Navigate to="/legal-acceptance" replace />;
  }

  // Gate 3: Moderation Warning
  const unacknowledgedWarning = violations?.find(v => !v.acknowledged && v.violation_level < 3);
  if (unacknowledgedWarning && location.pathname !== '/moderation-notice') {
    return <Navigate to="/moderation-notice" replace />;
  }

  // Prevent NEXA-only accounts from accessing WHISPRR
  if (profile && profile.access_level === 'nexa') {
    return <Navigate to="/restricted" replace />;
  }

  // If the user has no profile or has not completed onboarding, only allow them to access the onboarding page.
  if ((!profile || !profile.onboarding_complete) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
