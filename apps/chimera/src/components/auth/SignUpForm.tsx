import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpFormProps {
  onBack: () => void;
}

export function SignUpForm({ onBack }: SignUpFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [agreedTo18, setAgreedTo18] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }
    if (!agreedTo18 || !agreedToTerms) {
      setError('Please confirm your age and accept the Terms and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      setCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (created) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-2xl">✦</div>
        <h2 className="font-serif text-xl font-extrabold text-white">Check your inbox</h2>
        <p className="text-sm leading-relaxed text-warm-300">We sent a confirmation link to <strong className="text-white">{email}</strong>. Once confirmed, return here to begin with CHIMERA.</p>
        <button type="button" onClick={onBack} className="text-sm font-bold text-amber-300 hover:text-amber-200">Back to sign in</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-300">{error}</div>}
      <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wider text-warm-300">
        Email address
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isLoading} placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-white/10 bg-warm-900/50 px-4 py-3.5 text-sm normal-case tracking-normal text-white placeholder-warm-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50" />
      </label>
      <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wider text-warm-300">
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isLoading} placeholder="At least 8 characters" className="mt-1.5 w-full rounded-xl border border-white/10 bg-warm-900/50 px-4 py-3.5 text-sm normal-case tracking-normal text-white placeholder-warm-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50" />
      </label>
      <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wider text-warm-300">
        Confirm password
        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={isLoading} placeholder="Repeat your password" className="mt-1.5 w-full rounded-xl border border-white/10 bg-warm-900/50 px-4 py-3.5 text-sm normal-case tracking-normal text-white placeholder-warm-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50" />
      </label>
      <div className="space-y-3 pt-1 text-sm text-warm-300">
        <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={agreedTo18} onChange={(event) => setAgreedTo18(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-warm-500 text-red-500 focus:ring-red-500" /><span>I confirm that I am at least 18 years old.</span></label>
        <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-warm-500 text-red-500 focus:ring-red-500" /><span>I agree to the <a href="/terms" target="_blank" className="text-red-300 underline">Terms</a> and <a href="/privacy" target="_blank" className="text-red-300 underline">Privacy Policy</a>.</span></label>
      </div>
      <button type="submit" disabled={isLoading || !agreedTo18 || !agreedToTerms} className="mt-2 flex w-full items-center justify-center rounded-xl bg-red-500 px-6 py-4 font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
        {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Create WHISPRR Account'}
      </button>
    </form>
  );
}
