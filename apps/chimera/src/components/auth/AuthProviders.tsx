import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthProvidersProps {
  mode: 'signin' | 'signup';
  onEmailClick: () => void;
}

export function AuthProviders({ mode, onEmailClick }: AuthProvidersProps) {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setLoadingProvider('google');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed.');
      setLoadingProvider(null);
    }
  };

  const handleApple = async () => {
    setError('');
    setLoadingProvider('apple');
    try {
      await signInWithApple();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apple sign in failed.');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {error && (
        <div className="p-3 rounded-xl bg-error-500/10 border border-error-500/30 text-error-400 text-sm font-medium text-center">
          {error}
        </div>
      )}

      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
      </button>

      {/* Apple */}
      <button
        onClick={handleApple}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 12.04c-.03-2.07 1.69-3.07 1.77-3.12-.97-1.41-2.47-1.6-3-1.62-1.27-.13-2.49.75-3.14.75-.65 0-1.65-.73-2.72-.71-1.4.02-2.69.81-3.41 2.06-1.45 2.52-.37 6.24 1.04 8.28.69.99 1.51 2.11 2.58 2.07 1.04-.04 1.43-.67 2.69-.67 1.26 0 1.61.67 2.71.65 1.12-.02 1.83-1.01 2.51-2.01.79-1.15 1.12-2.27 1.14-2.33-.03-.01-2.19-.84-2.22-3.33M14.63 5.5c.57-.7.96-1.66.85-2.62-.83.03-1.83.55-2.42 1.25-.53.62-.99 1.59-.87 2.53.92.07 1.87-.47 2.44-1.16" />
        </svg>
        {loadingProvider === 'apple' ? 'Connecting...' : 'Continue with Apple'}
      </button>

      {/* Email */}
      <button
        onClick={onEmailClick}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-xl transition-all duration-200 text-primary-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {mode === 'signin' ? 'Continue with Email' : 'Sign up with Email'}
      </button>
    </div>
  );
}
