import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpFormProps {
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Legal Acceptance
  const [agreedTo18, setAgreedTo18] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Account created! Please check your email (and spam folder) to verify your account, then sign in.');
      setIsLoading(false);
      onSuccess?.();
      
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      if (msg.toLowerCase().includes('already registered')) {
        msg = 'An account with this email already exists. Please sign in or reset your password.';
      }
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-warm-300 uppercase tracking-wider pl-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-warm-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-warm-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-warm-300 uppercase tracking-wider pl-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-warm-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-warm-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
            placeholder="Min. 6 characters"
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-warm-300 uppercase tracking-wider pl-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-warm-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-warm-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
            placeholder="Repeat password"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-3 mt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 w-5 h-5 rounded border-warm-300 text-red-500 focus:ring-red-500 bg-white dark:bg-warm-900"
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
            className="mt-1 w-5 h-5 rounded border-warm-300 text-red-500 focus:ring-red-500 bg-white dark:bg-warm-900"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span className="text-sm text-warm-700 dark:text-warm-300">
            I agree to the <a href="/terms" className="text-red-500 hover:underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-red-500 hover:underline" target="_blank">Privacy Policy</a>. (Please read the terms of service and privacy policy as it is important).
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !agreedTo18 || !agreedToTerms}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating Account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
