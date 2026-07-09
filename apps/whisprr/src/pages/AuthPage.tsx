import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/common/Logo';

type TabType = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  // Legal Acceptance
  const [agreedTo18, setAgreedTo18] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('whisprr_referrer', ref);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (!agreedTo18 || !agreedToTerms) {
        setError('You must confirm your age and agree to the legal terms to create an account.');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      await signUp(email, password);
      setError('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setActiveTab('signin');
      setError('Account created! Please check your email (and spam folder) to verify your account, then sign in.');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      if (msg.toLowerCase().includes('already registered')) {
        msg = 'An account with this email already exists. Please sign in or reset your password.';
      }
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email) {
        setError('Please enter your email address');
        setIsLoading(false);
        return;
      }

      await resetPassword(email);
      setResetSent(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-full"></div>
          <p className="text-warm-600 dark:text-warm-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <Logo size={64} />
          <h1 className="font-serif text-4xl font-bold text-primary-500">
            WHISPRR
          </h1>
          <p className="text-warm-600 dark:text-warm-400 font-medium">Where connections feel real</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-warm-100 dark:bg-warm-900 p-1 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('signin');
              setError('');
              setResetSent(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-warm-800 text-primary-500 shadow-soft'
                : 'text-warm-600 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setError('');
              setResetSent(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-warm-800 text-primary-500 shadow-soft'
                : 'text-warm-600 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => {
              setActiveTab('forgot');
              setError('');
              setResetSent(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'forgot'
                ? 'bg-white dark:bg-warm-800 text-primary-500 shadow-soft'
                : 'text-warm-600 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Card Container */}
        <div className="card p-6">
          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-2xl ${
              error.includes('created') || error.includes('check your email')
                ? 'bg-success-50 border border-success-200 text-success-700'
                : 'bg-error-50 border border-error-200 text-error-700'
            }`}>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Sign In Tab */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-semibold text-warm-900 dark:text-white mb-2">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-sm font-semibold text-warm-900 dark:text-white mb-2">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200 dark:border-warm-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="currentColor">
                    G
                  </text>
                </svg>
                Continue with Google
              </button>

            </form>
          )}

          {/* Sign Up Tab */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold text-warm-900 dark:text-white mb-2">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold text-warm-900 dark:text-white mb-2">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-semibold text-warm-900 dark:text-white mb-2">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3 mt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500 bg-white dark:bg-warm-900"
                    checked={agreedTo18}
                    onChange={(e) => setAgreedTo18(e.target.checked)}
                  />
                  <span className="text-sm text-warm-700 dark:text-warm-300">
                    I confirm that I am at least 18 years old or older.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500 bg-white dark:bg-warm-900"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span className="text-sm text-warm-700 dark:text-warm-300">
                    I agree to the <Link to="/terms" className="text-primary-500 hover:underline" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="text-primary-500 hover:underline" target="_blank">Privacy Policy</Link>. (Please read the terms of service and privacy policy as it is important).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !agreedTo18 || !agreedToTerms}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200 dark:border-warm-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || !agreedTo18 || !agreedToTerms}
                className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="currentColor">
                    G
                  </text>
                </svg>
                Continue with Google
              </button>
            </form>
          )}

          {/* Forgot Password Tab */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetSent ? (
                <div className="text-center py-6">
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
                    Check your email
                  </h3>
                  <p className="text-warm-600 dark:text-warm-300 text-sm mb-6">
                    We've sent you a link to reset your password. It may take a few minutes to arrive.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setEmail('');
                      setActiveTab('signin');
                    }}
                    className="btn-ghost"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-warm-600 dark:text-warm-300 text-sm mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-semibold text-warm-900 dark:text-white mb-2">
                      Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      className="input-field"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="btn-ghost w-full"
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-warm-500 dark:text-warm-400">
            Join a thoughtful network built for authentic connections.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-warm-400 dark:text-warm-500">
            <Link to="/trust" className="hover:text-primary-500 transition-colors">Trust & Privacy Center</Link>
            <span>&middot;</span>
            <a href="mailto:help@whisprr.xyz" className="hover:text-primary-500 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
