import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
