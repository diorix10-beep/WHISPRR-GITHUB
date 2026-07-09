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

  // Prevent flash of login screen while Supabase parses OAuth callback hash in the background
  if (window.location.hash.includes('access_token=') || window.location.hash.includes('error_description=')) {
    return (
      <div className="h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-500" />
      </div>
    );
  }

  return <Outlet />;
}
