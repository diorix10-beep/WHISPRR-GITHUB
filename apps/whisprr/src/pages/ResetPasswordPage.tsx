import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ─── WHISPRR Logo (matches new brand identity) ────────────────────────────────
function WhisprLogo({ size = 40 }: { size?: number }) {
  const id = `wg-rp-${size}`;
  return (
    <svg
      width={size * 2.5}
      height={size}
      viewBox="0 0 180 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="WHISPRR"
      role="img"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        d="M4 10 L16 52 L28 24 L40 52 L52 10"
        stroke={`url(#${id})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M62 8 L63.8 13.5 L69.5 15.3 L63.8 17.1 L62 22.5 L60.2 17.1 L54.5 15.3 L60.2 13.5 Z" fill="#a855f7" fillOpacity="0.95" />
      <path d="M74 16 L74.9 18.6 L77.5 19.5 L74.9 20.4 L74 23 L73.1 20.4 L70.5 19.5 L73.1 18.6 Z" fill="#c084fc" fillOpacity="0.75" />
      <text x="88" y="48" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="800" fontSize="28" letterSpacing="1.5" fill="white">
        WHISPRR
      </text>
    </svg>
  );
}

type Stage = 'verifying' | 'ready' | 'success' | 'error';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('verifying');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Supabase sends the user back with a URL fragment like:
  //    /reset-password#access_token=xxx&refresh_token=yyy&type=recovery
  //
  //    onAuthStateChange fires a PASSWORD_RECOVERY event when it detects
  //    this fragment and exchanges the tokens automatically.
  //    We listen for that event to know a valid recovery session is active.
  useEffect(() => {
    // First, check if we already have a recovery session from the URL hash.
    // Supabase JS v2 automatically parses the hash and creates a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Valid recovery token — show the new password form
        setStage('ready');
      } else if (event === 'SIGNED_IN' && session) {
        // If somehow already signed in via recovery token
        setStage('ready');
      }
    });

    // Also handle the case where the page loads with the hash already present
    // by calling getSession() — Supabase will have already parsed it.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if this session came from a recovery flow
        // The URL hash contains type=recovery when coming from the email link
        const hash = window.location.hash;
        if (hash.includes('type=recovery') || hash.includes('access_token')) {
          setStage('ready');
        } else if (session.user) {
          // Already authenticated normally — redirect to app
          navigate('/feed', { replace: true });
        } else {
          setStage('error');
        }
      } else {
        // No session yet — wait for PASSWORD_RECOVERY event from onAuthStateChange.
        // If none arrives after parsing the hash, it's an invalid/expired link.
        const hash = window.location.hash;
        if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
          setStage('error');
        }
        // Otherwise leave as 'verifying' — the onAuthStateChange handler above
        // will fire PASSWORD_RECOVERY and move us to 'ready'.
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setStage('success');
      // Give the user a moment to read the success message, then redirect
      setTimeout(() => navigate('/feed', { replace: true }), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .rp-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #0d0818 0%, #110b22 50%, #0a0a15 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 24px;
        }
        .rp-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 28px;
          padding: 40px 36px;
          backdrop-filter: blur(20px);
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .rp-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 13px 16px;
          color: white;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .rp-input::placeholder { color: rgba(255,255,255,0.3); }
        .rp-input:focus {
          border-color: rgba(168,85,247,0.65);
          background: rgba(168,85,247,0.06);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.12);
        }
        .rp-btn {
          width: 100%;
          padding: 13px 24px;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 24px rgba(139,92,246,0.4);
          box-sizing: border-box;
        }
        .rp-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .rp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rp-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.65);
          margin-bottom: 8px;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .rp-card { animation: fadeIn 0.4s ease; }
      `}</style>

      <div className="rp-root">
        <div className="rp-card">
          {/* Logo */}
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
            <WhisprLogo size={36} />
          </div>

          {/* ── VERIFYING ── */}
          {stage === 'verifying' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '3px solid rgba(168,85,247,0.25)',
                borderTopColor: '#a855f7',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }} />
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 20, margin: '0 0 8px' }}>
                Verifying your link…
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0 }}>
                Please wait while we confirm your reset request.
              </p>
            </div>
          )}

          {/* ── READY — show new password form ── */}
          {stage === 'ready' && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: 24, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                  Choose a new password
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
                  Pick something strong that you'll remember.
                </p>
              </div>

              {error && (
                <div style={{
                  marginBottom: 20, padding: '12px 14px', borderRadius: 14,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5', fontSize: 13, fontWeight: 500,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label htmlFor="rp-new-pass" className="rp-label">New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="rp-new-pass"
                      type={showPassword ? 'text' : 'password'}
                      className="rp-input"
                      style={{ paddingRight: 56 }}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="rp-confirm-pass" className="rp-label">Confirm new password</label>
                  <input
                    id="rp-confirm-pass"
                    type="password"
                    className="rp-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                {/* Password strength hint */}
                {password.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: -6 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: password.length >= i * 3
                          ? password.length >= 12 ? '#22c55e'
                          : password.length >= 8 ? '#a855f7'
                          : '#f59e0b'
                          : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                )}

                <button type="submit" className="rp-btn" disabled={isLoading} style={{ marginTop: 4 }}>
                  {isLoading ? 'Saving…' : 'Set New Password'}
                </button>
              </form>
            </>
          )}

          {/* ── SUCCESS ── */}
          {stage === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, margin: '0 auto 20px',
              }}>
                ✓
              </div>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 22, margin: '0 0 10px' }}>
                Password updated!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Your new password is set. Redirecting you into WHISPRR…
              </p>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '3px solid rgba(168,85,247,0.25)',
                borderTopColor: '#a855f7',
                margin: '0 auto',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
          )}

          {/* ── ERROR — invalid / expired link ── */}
          {stage === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, margin: '0 auto 20px',
              }}>
                ⚠️
              </div>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 22, margin: '0 0 10px' }}>
                Invalid or expired link
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
                This password reset link has expired or has already been used.
                Please request a new one from the sign-in page.
              </p>
              <a
                href="/auth"
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  borderRadius: 14,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
                }}
              >
                Back to Sign In
              </a>
            </div>
          )}

          {/* Footer */}
          <p style={{
            marginTop: 32, textAlign: 'center',
            fontSize: 12, color: 'rgba(255,255,255,0.2)',
          }}>
            © 2025 WHISPRR · The Home of Creators
          </p>
        </div>
      </div>
    </>
  );
}
