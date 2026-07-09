import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ModerationNoticePage() {
  const { violations, acknowledgeViolation, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Find the first unacknowledged warning
  const warning = useMemo(() => {
    return violations?.find(v => !v.acknowledged && v.violation_level < 3);
  }, [violations]);

  const handleAcknowledge = async () => {
    if (!warning) return;
    setLoading(true);
    try {
      await acknowledgeViolation(warning.id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (!warning) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-warm-900 rounded-3xl p-8 shadow-xl border border-warning-200 dark:border-warning-900/30">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 text-warning-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-white mb-2">Notice from Moderation</h1>
          <p className="text-warm-600 dark:text-warm-400">
            Please review the following notice regarding your account activity.
          </p>
        </div>

        <div className="bg-warm-50 dark:bg-warm-950/50 p-6 rounded-2xl mb-8 border border-warm-200 dark:border-warm-800">
          <p className="font-medium text-warm-900 dark:text-white mb-2">Reason for notice:</p>
          <p className="text-warm-700 dark:text-warm-300 bg-white/50 dark:bg-warm-900/50 p-4 rounded-xl border border-warm-200 dark:border-warm-700">
            {warning.description}
          </p>
          <p className="text-sm text-warm-600 dark:text-warm-400">
            Please review our <Link to="/guidelines" className="text-primary-500 hover:underline">Community Guidelines</Link> to ensure your future interactions align with our platform rules.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAcknowledge}
            disabled={loading}
            className="w-full bg-warning-500 hover:bg-warning-600 text-white font-medium py-3.5 px-4 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Acknowledging...' : 'I understand and will comply'}
          </button>
          
          <button
            onClick={() => signOut()}
            className="text-sm font-medium text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 py-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
