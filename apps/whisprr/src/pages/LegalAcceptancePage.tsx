import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, CURRENT_LEGAL_VERSION } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function LegalAcceptancePage() {
  const [agreedTo18, setAgreedTo18] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { acceptLegalTerms, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!agreedTo18 || !agreedToTerms) return;
    setLoading(true);
    try {
      await acceptLegalTerms(CURRENT_LEGAL_VERSION);
      navigate('/welcome');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-warm-900 rounded-3xl p-8 shadow-xl border border-warm-200 dark:border-warm-800">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-white mb-2">Updated Policies</h1>
          <p className="text-warm-600 dark:text-warm-400">
            We have updated our Terms of Service and Privacy Policy to better protect our community. You must review and accept them to continue.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-warm-200 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-800/50 transition-colors">
            <input
              type="checkbox"
              className="mt-1 w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500 bg-white dark:bg-warm-900"
              checked={agreedTo18}
              onChange={(e) => setAgreedTo18(e.target.checked)}
            />
            <span className="text-sm font-medium text-warm-800 dark:text-warm-200">
              I confirm that I am at least 18 years old or older.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-warm-200 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-800/50 transition-colors">
            <input
              type="checkbox"
              className="mt-1 w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500 bg-white dark:bg-warm-900"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span className="text-sm font-medium text-warm-800 dark:text-warm-200">
              I agree to the <Link to="/terms" className="text-primary-500 hover:underline" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="text-primary-500 hover:underline" target="_blank">Privacy Policy</Link>. (Please read the terms of service and privacy policy as it is important).
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            disabled={!agreedTo18 || !agreedToTerms || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-4"
          >
            {loading ? 'Updating...' : 'I Accept'}
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
