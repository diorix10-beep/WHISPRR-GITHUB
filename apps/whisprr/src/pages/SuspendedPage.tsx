import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function SuspendedPage() {
  const { violations, signOut } = useAuth();
  const navigate = useNavigate();

  // Find active suspension
  const suspension = useMemo(() => {
    return violations?.find(v => v.violation_level >= 3 && (!v.expires_at || new Date(v.expires_at) > new Date()));
  }, [violations]);

  if (!suspension) {
    navigate('/');
    return null;
  }

  const isPermanent = suspension.violation_level === 4 || !suspension.expires_at;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-warm-900 rounded-3xl p-8 shadow-xl border border-error-200 dark:border-error-900/30">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 text-error-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-white mb-2">Account {isPermanent ? 'Banned' : 'Suspended'}</h1>
          <p className="text-warm-600 dark:text-warm-400">
            Your account has been {isPermanent ? 'permanently banned' : 'temporarily suspended'} due to a violation of our community standards.
          </p>
        </div>

        <div className="bg-warm-50 dark:bg-warm-950/50 p-6 rounded-2xl mb-8 border border-warm-200 dark:border-warm-800">
          <p className="text-sm font-semibold text-warm-500 uppercase tracking-wider mb-2">Reason</p>
          <p className="text-warm-800 dark:text-warm-200 mb-6 whitespace-pre-wrap">
            {suspension.description}
          </p>
          
          {!isPermanent && suspension.expires_at && (
            <>
              <p className="text-sm font-semibold text-warm-500 uppercase tracking-wider mb-2">Suspension Ends</p>
              <p className="text-warm-800 dark:text-warm-200 font-medium">
                {new Date(suspension.expires_at).toLocaleString()}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => signOut()}
            className="w-full bg-warm-200 hover:bg-warm-300 dark:bg-warm-800 dark:hover:bg-warm-700 text-warm-800 dark:text-warm-200 font-medium py-3.5 px-4 rounded-xl transition-all duration-300"
          >
            Sign Out
          </button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-warm-600 dark:text-warm-400">
              Questions? Review our <Link to="/guidelines" className="text-primary-500 hover:underline">Community Guidelines</Link> or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
