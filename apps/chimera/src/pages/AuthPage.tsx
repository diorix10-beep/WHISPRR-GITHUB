import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'signin' | 'signup';

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/discover';

  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (tab === 'signup' && (!adult || !terms)) {
      setError('Please confirm that you are 18 or older and accept the Terms and Privacy Policy.');
      return;
    }
    setBusy(true);
    try {
      if (tab === 'signin') {
        await signIn(email.trim(), password);
        navigate(from, { replace: true });
      } else {
        await signUp(email.trim(), password);
        setNotice('Check your inbox to confirm your e-mail address, then sign in.');
        setTab('signin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-2 h-12 w-full rounded-xl border border-chimera-gold/30 bg-chimera-bg px-4 text-base text-chimera-ink outline-none focus:border-chimera-gold';

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-14">
      <p className="mb-3 text-center text-sm font-bold tracking-[0.26em] text-chimera-gold">WELCOME</p>
      <h1 className="text-center font-serif text-5xl font-semibold">{tab === 'signin' ? 'Sign in' : 'Create your account'}</h1>

      <div role="tablist" aria-label="Account" className="mx-auto mt-8 flex gap-1 rounded-full border border-chimera-gold/35 p-1 text-sm font-bold">
        <button type="button" role="tab" aria-selected={tab === 'signin'} onClick={() => setTab('signin')} className={`min-h-[44px] flex-1 rounded-full ${tab === 'signin' ? 'bg-chimera-gold text-[#1a1208]' : 'text-violet-100/80'}`}>Sign in</button>
        <button type="button" role="tab" aria-selected={tab === 'signup'} onClick={() => setTab('signup')} className={`min-h-[44px] flex-1 rounded-full ${tab === 'signup' ? 'bg-chimera-gold text-[#1a1208]' : 'text-violet-100/80'}`}>Sign up</button>
      </div>

      <form onSubmit={submit} className="mt-8 rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-7">
        <label className="block text-sm font-medium" htmlFor="auth-email">E-mail
          <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label className="mt-5 block text-sm font-medium" htmlFor="auth-password">Password
          <input id="auth-password" type="password" required minLength={8} autoComplete={tab === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>

        {tab === 'signup' && (
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-violet-100/85">
            <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 h-5 w-5 accent-[#e8c27a]" />I am 18 years old or older.</label>
            <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-5 w-5 accent-[#e8c27a]" /><span>I accept the <Link to="/terms" target="_blank" rel="noopener" className="underline">Terms<span className="sr-only"> (opens in a new tab)</span></Link> and the <Link to="/privacy" target="_blank" rel="noopener" className="underline">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></Link>.</span></label>
          </div>
        )}

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-xl border border-chimera-mint/40 bg-chimera-mint/10 px-4 py-3 text-sm text-green-100">{notice}</p>}

        <button type="submit" disabled={busy} className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-chimera-gold px-6 text-base font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-60">
          {busy ? 'One moment…' : tab === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
