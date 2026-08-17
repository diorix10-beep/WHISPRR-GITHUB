import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface EmailOtpVerifyFormProps {
  email: string;
  onBack: () => void;
}

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function describeVerificationError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('expired')) return 'That code has expired. Request a fresh one and try again.';
  if (message.includes('invalid') || message.includes('token') || message.includes('otp')) return 'That code does not match. Check the email and try again.';
  return 'We could not verify that code. Please try again.';
}

export function EmailOtpVerifyForm({ email, onBack }: EmailOtpVerifyFormProps) {
  const { requestEmailOtp, verifyEmailOtp } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    return () => {
      if (successTimer.current) window.clearTimeout(successTimer.current);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const setCode = (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = cleanValue;
      return next;
    });
    setError('');
    if (cleanValue && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((digit, index) => { next[index] = digit; });
    setDigits(next);
    setError('');
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH) - 1]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = digits.join('');
    if (token.length !== CODE_LENGTH) {
      setError('Enter all six digits from the email before continuing.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await verifyEmailOtp(email, token);
      setIsVerified(true);
      successTimer.current = window.setTimeout(() => { window.location.assign('/'); }, 800);
    } catch (err) {
      setError(describeVerificationError(err));
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError('');
    setIsResending(true);
    try {
      await requestEmailOtp(email);
      setDigits(Array(CODE_LENGTH).fill(''));
      setCooldown(RESEND_COOLDOWN_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send another code yet.');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="py-8 text-center" role="status" aria-live="polite">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 text-2xl text-emerald-200">✓</div>
        <h2 className="mt-5 font-serif text-2xl font-semibold text-white">The door is open.</h2>
        <p className="mt-2 text-sm text-warm-400">Taking you into CHIMERA now.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent-300">Verification chamber</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-white">Enter your sign-in code.</h2>
        <p className="mt-2 text-sm leading-relaxed text-warm-400">A six-digit code is waiting in <span className="font-semibold text-warm-200">{email}</span>.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm leading-relaxed text-red-200">{error}</div>}

      <div className="rounded-2xl border border-accent-400/25 bg-gradient-to-br from-accent-500/10 via-white/[0.03] to-purple-500/10 p-4 sm:p-5">
        <label className="sr-only" htmlFor="chimera-otp-0">Six-digit verification code</label>
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              id={`chimera-otp-${index}`}
              ref={(element) => { inputRefs.current[index] = element; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              aria-label={`Verification digit ${index + 1} of ${CODE_LENGTH}`}
              value={digit}
              onChange={(event) => setCode(event.target.value, index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              disabled={isLoading}
              className="h-12 w-10 rounded-xl border border-white/15 bg-warm-950/80 text-center font-sans text-xl font-bold text-white outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-500/30 sm:h-14 sm:w-12 sm:text-2xl"
            />
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-warm-500">Codes expire soon. Never share yours with anyone.</p>
      </div>

      <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-accent-600 via-primary-500 to-purple-500 px-6 py-4 font-bold text-white shadow-[0_0_28px_rgba(204,90,131,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
        {isLoading ? <span className="flex items-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Verifying...</span> : 'Enter CHIMERA'}
      </button>

      <div className="flex items-center justify-between gap-3 text-xs">
        <button type="button" onClick={onBack} className="font-semibold text-warm-400 transition hover:text-white">← Use another email</button>
        <button type="button" onClick={handleResend} disabled={cooldown > 0 || isResending} className="font-semibold text-accent-300 transition hover:text-accent-200 disabled:cursor-not-allowed disabled:text-warm-600">
          {isResending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
