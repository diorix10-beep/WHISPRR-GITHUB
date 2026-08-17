import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, CURRENT_LEGAL_VERSION } from '../../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, profile, violations, chimeraPreferences, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-warm-950 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-300/30 border-t-purple-400" /></div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Gate 1: Active Suspensions
  const activeSuspension = violations?.find(v => v.violation_level >= 3 && (!v.expires_at || new Date(v.expires_at) > new Date()));
  if (activeSuspension && location.pathname !== '/suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Gate 2: Legal Acceptance (Check both profile & user metadata)
  const hasAcceptedLegal = 
    (profile && profile.legal_accepted_version === CURRENT_LEGAL_VERSION) ||
    (user && user.user_metadata?.legal_accepted_version === CURRENT_LEGAL_VERSION);

  if (!hasAcceptedLegal && location.pathname !== '/legal-acceptance') {
    return <Navigate to="/legal-acceptance" replace />;
  }

  // Gate 3: Moderation Warning
  const unacknowledgedWarning = violations?.find(v => !v.acknowledged && v.violation_level < 3);
  if (unacknowledgedWarning && location.pathname !== '/moderation-notice') {
    return <Navigate to="/moderation-notice" replace />;
  }

  // Allow chimera, ecosystem, and whisprr access levels
  if (profile && profile.access_level !== 'chimera' && profile.access_level !== 'ecosystem' && profile.access_level !== 'whisprr') {
    return <Navigate to="/restricted" replace />;
  }

  if (chimeraPreferences && !chimeraPreferences.chimera_onboarding_complete && location.pathname !== '/onboarding' && location.pathname !== '/legal-acceptance') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
