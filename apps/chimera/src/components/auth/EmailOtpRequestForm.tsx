import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface EmailOtpRequestFormProps {
  onCodeSent: (email: string) => void;
  onUsePassword: () => void;
}

export function EmailOtpRequestForm({ onCodeSent, onUsePassword }: EmailOtpRequestFormProps) {
  const { requestEmailOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setError('');

    if (!normalizedEmail) {
      setError('Enter the email address connected to your CHIMERA account.');
      return;
    }

    setIsLoading(true);
    try {
      await requestEmailOtp(normalizedEmail);
      onCodeSent(normalizedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send your code. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent-300">Private entrance</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-white">Your gateway is ready.</h2>
        <p className="mt-2 text-sm leading-relaxed text-warm-400">
          We will send a six-digit sign-in code to your email. No password to remember, just a quiet step into your creative universe.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm leading-relaxed text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="otp-email" className="pl-1 text-xs font-semibold uppercase tracking-wider text-warm-300">
          Email address
        </label>
        <input
          id="otp-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={isLoading}
          className="w-full rounded-xl border border-white/10 bg-warm-950/70 px-4 py-3.5 text-white placeholder-warm-500 outline-none transition focus:border-accent-400/70 focus:ring-2 focus:ring-accent-500/20 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-accent-600 via-primary-500 to-purple-500 px-6 py-4 font-bold text-white shadow-[0_0_28px_rgba(204,90,131,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <span className="flex items-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Sending your code...</span>
        ) : 'Send my sign-in code'}
      </button>

      <button type="button" onClick={onUsePassword} className="text-center text-xs font-semibold text-warm-400 transition hover:text-white">
        Prefer a password? Sign in that way instead.
      </button>
    </form>
  );
}
