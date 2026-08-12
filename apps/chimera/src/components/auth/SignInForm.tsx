import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

interface SignInFormProps {
  onSuccess?: () => void;
  onForgotPassword: () => void;
}

export function SignInForm({ onSuccess, onForgotPassword }: SignInFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-warm-300/80 pl-0.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#18181C]/90 border border-[#2D2A26] rounded-xl px-4 py-3 text-sm text-white placeholder-warm-500/50 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 transition-all shadow-inner"
            placeholder="you@example.com"
            disabled={isLoading}
            required
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center pl-0.5">
            <label className="text-xs font-medium text-warm-300/80">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[11px] font-medium text-amber-400/80 hover:text-amber-300 transition-colors"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#18181C]/90 border border-[#2D2A26] rounded-xl px-4 py-3 text-sm text-white placeholder-warm-500/50 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 transition-all shadow-inner pr-10"
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-warm-400 hover:text-white transition-colors"
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Gold Enter Chimera Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-6 bg-gradient-to-r from-[#D9A353] via-[#C99245] to-[#B88137] hover:from-[#E5AF5F] hover:to-[#C99245] text-warm-950 font-serif font-bold text-base rounded-xl shadow-[0_0_20px_rgba(217,163,83,0.25)] hover:shadow-[0_0_30px_rgba(217,163,83,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center mt-2 cursor-pointer"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-warm-950/30 border-t-warm-950 rounded-full animate-spin" />
        ) : (
          'Enter Chimera'
        )}
      </button>
    </form>
  );
}
