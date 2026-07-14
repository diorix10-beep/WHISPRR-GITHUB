import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { brand } from '../brand/brandConfig';

type TabType = 'signin' | 'signup' | 'forgot';

// ─── New WHISPRR Logo (gradient W + sparkles + wordmark) ──────────────────────
function WhisprLogo({ size = 48 }: { size?: number }) {
  const id = `whisprr-grad-${size}`;
  return (
    <svg
      width={size * 2.5}
      height={size}
      viewBox="0 0 180 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* W lettermark */}
      <path
        d="M4 10 L16 52 L28 24 L40 52 L52 10"
        stroke={`url(#${id})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Sparkle large */}
      <path
        d="M62 8 L63.8 13.5 L69.5 15.3 L63.8 17.1 L62 22.5 L60.2 17.1 L54.5 15.3 L60.2 13.5 Z"
        fill="#a855f7"
        opacity="0.95"
      />
      {/* Sparkle small */}
      <path
        d="M74 16 L74.9 18.6 L77.5 19.5 L74.9 20.4 L74 23 L73.1 20.4 L70.5 19.5 L73.1 18.6 Z"
        fill="#c084fc"
        opacity="0.7"
      />
      {/* WHISPRR wordmark */}
      <text
        x="88"
        y="48"
        fontFamily="'Inter', 'SF Pro Display', -apple-system, sans-serif"
        fontWeight="800"
        fontSize="28"
        letterSpacing="1.5"
        fill="white"
      >
        WHISPRR
      </text>
    </svg>
  );
}

// ─── Floating social notification cards ──────────────────────────────────────
function FloatingCard({ className = '', delay = '0s', children }: { className?: string; delay?: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute backdrop-blur-md rounded-2xl shadow-2xl p-3 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        animation: `floatCard 6s ease-in-out infinite`,
        animationDelay: delay,
      }}
    >
      {children}
    </div>
  );
}

function CardStoryPublished() {
  return (
    <div style={{ width: 210 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Story Published · 1h</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📖</div>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>Eclipse of Tomorrow</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>Chapter 7 is out now!</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            <span>❤️ 2.1K</span><span>💬 153</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardCharacterShared() {
  return (
    <div style={{ width: 200 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>New Character Shared · 2h</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#db2777,#7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎭</div>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Aria Nightshade</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>A mysterious rogue</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            <span>❤️ 892</span><span>💬 45</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardWorldCreated() {
  return (
    <div style={{ width: 210 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>World Created · 4h</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗺️</div>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>The Lost Realms</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>A world of magic and secrets</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            <span>❤️ 1.7K</span><span>💬 102</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardCollaboration() {
  return (
    <div style={{ width: 200 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Collaboration · 2h</p>
      <p style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>New collaboration</p>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 8 }}>with @LunaWrites</p>
      <div style={{ display: 'flex', marginLeft: -4 }}>
        {['🦊','🐺','🦋','🌙'].map((e, i) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: '#4c1d95', border: '1.5px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginLeft: i > 0 ? -6 : 0 }}>{e}</div>
        ))}
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(76,29,149,0.6)', border: '1.5px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginLeft: -6 }}>2h</div>
      </div>
    </div>
  );
}

function CardCommunityJoined() {
  return (
    <div style={{ width: 210 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Community Joined · 3h</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👥</div>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>Fantasy Writers Hub</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Welcome to the community!</p>
        </div>
      </div>
      <div style={{ display: 'flex', marginLeft: -2 }}>
        {['🌿','⚔️','🔮','🐉','✨'].map((e, i) => (
          <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: '#312e81', border: '1.5px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, marginLeft: i > 0 ? -5 : 0 }}>{e}</div>
        ))}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 8, alignSelf: 'center' }}>3h</span>
      </div>
    </div>
  );
}

function CardNewMessage() {
  return (
    <div style={{ width: 200 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>New Message · 1m</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#d946ef,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' }}>S</div>
        <p style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>@StarBuilder</p>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5 }}>Loved your universe! Let's create something together ✨</p>
    </div>
  );
}

// ─── Google logo SVG ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Apple logo SVG ──────────────────────────────────────────────────────────
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.28.07 2.18.79 3.08.84 1.17-.24 2.29-.95 3.55-.84 1.52.12 2.65.72 3.4 1.88-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.51 3.87zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

// ─── AuthPage ─────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [agreedTo18, setAgreedTo18] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('whisprr_referrer', ref);
  }, []);

  const switchTab = (tab: TabType) => { setActiveTab(tab); setError(''); setResetSent(false); };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      if (!email || !password) { setError('Please fill in all fields'); setIsLoading(false); return; }
      await signIn(email, password);
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign in failed.'); setIsLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); setIsLoading(false); return; }
      if (!agreedTo18 || !agreedToTerms) { setError('You must confirm your age and agree to the terms.'); setIsLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); setIsLoading(false); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); setIsLoading(false); return; }
      await signUp(email, password);
      setEmail(''); setPassword(''); setConfirmPassword('');
      switchTab('signin');
      setError('Account created! Check your email to verify, then sign in.');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Sign up failed.';
      if (msg.toLowerCase().includes('already registered')) msg = 'An account with this email already exists.';
      setError(msg); setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(''); setIsLoading(true);
    try { await signInWithGoogle(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign in failed.'); setIsLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      if (!email) { setError('Please enter your email address'); setIsLoading(false); return; }
      await resetPassword(email); setResetSent(true); setEmail('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send reset email.'); setIsLoading(false); }
  };

  const isSuccess = error.includes('created') || error.includes('verify') || error.includes('Check');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#08080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', margin: '0 auto 16px', opacity: 0.8 }} />
          <p style={{ color: '#c084fc', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Loading WHISPRR…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .auth-page-root {
          min-height: 100vh;
          background: #08080f;
          display: flex;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(0.3deg); }
          66% { transform: translateY(-4px) rotate(-0.3deg); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .auth-input {
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
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
        .auth-input:focus {
          border-color: rgba(168,85,247,0.65);
          background: rgba(168,85,247,0.06);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.12);
        }
        .auth-btn-primary {
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
        .auth-btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 30px rgba(139,92,246,0.5); }
        .auth-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-btn-social {
          width: 100%;
          padding: 12px 24px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-sizing: border-box;
        }
        .auth-btn-social:hover:not(:disabled) { background: rgba(255,255,255,0.11); border-color: rgba(255,255,255,0.22); }
        .auth-btn-social:disabled { opacity: 0.4; cursor: not-allowed; }
        .auth-tab-btn {
          flex: 1;
          padding: 10px 12px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255,255,255,0.4);
        }
        .auth-tab-btn.active {
          background: rgba(255,255,255,0.1);
          color: white;
          box-shadow: 0 1px 6px rgba(0,0,0,0.35);
        }
        .auth-tab-btn:hover:not(.active) { color: rgba(255,255,255,0.7); }
        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.65);
          margin-bottom: 8px;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.25);
          font-size: 12px;
          margin: 20px 0;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
      `}</style>

      <div className="auth-page-root">

        {/* ══════════════════════════════════════════════════
            LEFT SIDE — HERO ARTWORK
        ══════════════════════════════════════════════════ */}
        <div
          style={{
            flex: '0 0 58%',
            position: 'relative',
            overflow: 'hidden',
            display: 'none',
          }}
          className="lg-hero"
        >
          <style>{`
            @media (min-width: 1024px) {
              .lg-hero { display: flex !important; flex-direction: column; }
            }
          `}</style>

          {/* Hero background */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/auth-hero.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }} />

          {/* Purple overlay + vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              linear-gradient(to right, rgba(8,5,20,0.75) 0%, rgba(18,8,35,0.45) 50%, rgba(8,5,20,0.65) 100%),
              radial-gradient(ellipse at 50% 110%, rgba(8,5,20,0.85) 0%, transparent 55%)
            `,
          }} />

          {/* Purple glow blobs */}
          <div style={{
            position: 'absolute', top: '25%', left: '33%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '25%', right: '25%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)', pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 40 }}>

            {/* Logo + tagline */}
            <div>
              <WhisprLogo size={40} />
              <p style={{ color: '#c084fc', fontWeight: 700, fontSize: 20, marginTop: 12, letterSpacing: '-0.2px' }}>
                The Home of Creators.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 6, lineHeight: 1.6, maxWidth: 280 }}>
                Where creators connect,<br />share, and build together.
              </p>
            </div>

            {/* Floating cards area */}
            <div style={{ position: 'relative', flex: 1 }}>
              {/* Story Published */}
              <div style={{ position: 'absolute', left: 0, top: '8%', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'floatCard 6s ease-in-out infinite', animationDelay: '0s' }}>
                <CardStoryPublished />
              </div>

              {/* Collaboration */}
              <div style={{ position: 'absolute', left: '35%', top: '2%', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'floatCard 6s ease-in-out infinite', animationDelay: '1.2s' }}>
                <CardCollaboration />
              </div>

              {/* Community Joined */}
              <div style={{ position: 'absolute', right: 0, top: '20%', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'floatCard 6s ease-in-out infinite', animationDelay: '1.8s' }}>
                <CardCommunityJoined />
              </div>

              {/* Character Shared */}
              <div style={{ position: 'absolute', left: '8%', top: '50%', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'floatCard 6s ease-in-out infinite', animationDelay: '0.7s' }}>
                <CardCharacterShared />
              </div>

              {/* World Created */}
              <div style={{ position: 'absolute', left: '30%', bottom: '5%', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'floatCard 6s ease-in-out infinite', animationDelay: '0.4s' }}>
                <CardWorldCreated />
              </div>

              {/* New Message */}
              <div style={{ position: 'absolute', right: 0, bottom: '15%', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'floatCard 6s ease-in-out infinite', animationDelay: '2.2s' }}>
                <CardNewMessage />
              </div>
            </div>

            {/* Footer */}
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>© 2025 WHISPRR · Built for every creator</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT SIDE — AUTH PANEL
        ══════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          overflowY: 'auto',
          background: 'linear-gradient(160deg, #0d0818 0%, #110b22 50%, #0a0a15 100%)',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* Mobile logo */}
            <style>{`@media (min-width: 1024px) { .auth-mobile-logo { display: none !important; } }`}</style>
            <div className="auth-mobile-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
              <WhisprLogo size={36} />
              <p style={{ color: '#c084fc', fontWeight: 600, fontSize: 13, marginTop: 8 }}>The Home of Creators.</p>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ color: 'white', fontWeight: 800, fontSize: 28, margin: '0 0 6px', letterSpacing: '-0.4px' }}>
                {activeTab === 'signin' ? 'Welcome back' : activeTab === 'signup' ? 'Join WHISPRR' : 'Reset password'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
                {activeTab === 'signin' ? 'Sign in to your creator space.'
                  : activeTab === 'signup' ? 'Create your account and start creating.'
                  : 'Enter your email to receive a reset link.'}
              </p>
            </div>

            {/* Tabs */}
            {activeTab !== 'forgot' && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button className={`auth-tab-btn ${activeTab === 'signin' ? 'active' : ''}`} onClick={() => switchTab('signin')}>Sign In</button>
                <button className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => switchTab('signup')}>Create Account</button>
              </div>
            )}

            {/* Glass card */}
            <div style={{
              borderRadius: 24,
              padding: 28,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
              {/* Error / success */}
              {error && (
                <div style={{
                  marginBottom: 20, padding: '12px 14px', borderRadius: 14, fontSize: 13, fontWeight: 500,
                  background: isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
                  color: isSuccess ? '#6ee7b7' : '#fca5a5',
                }}>
                  {error}
                </div>
              )}

              {/* SIGN IN */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label htmlFor="si-email" className="auth-label">Email address</label>
                    <input id="si-email" type="email" className="auth-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label htmlFor="si-pass" className="auth-label" style={{ margin: 0 }}>Password</label>
                      <button type="button" onClick={() => switchTab('forgot')} style={{ fontSize: 12, fontWeight: 600, color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input id="si-pass" type={showPassword ? 'text' : 'password'} className="auth-input" style={{ paddingRight: 56 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="auth-btn-primary" disabled={isLoading} style={{ marginTop: 4 }}>
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                  <div className="auth-divider">or continue with</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button type="button" className="auth-btn-social" onClick={handleGoogleSignIn} disabled={isLoading}>
                      <GoogleIcon /> Continue with Google
                    </button>
                    <button type="button" className="auth-btn-social" disabled title="Apple Sign In coming soon">
                      <AppleIcon /> Continue with Apple
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginLeft: 4 }}>Soon</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SIGN UP */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label htmlFor="su-email" className="auth-label">Email address</label>
                    <input id="su-email" type="email" className="auth-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                  </div>
                  <div>
                    <label htmlFor="su-pass" className="auth-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input id="su-pass" type={showPassword ? 'text' : 'password'} className="auth-input" style={{ paddingRight: 56 }} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="su-confirm" className="auth-label">Confirm password</label>
                    <input id="su-confirm" type="password" className="auth-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={agreedTo18} onChange={e => setAgreedTo18(e.target.checked)} style={{ accentColor: '#a855f7', width: 16, height: 16, flexShrink: 0, marginTop: 2, cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        I confirm I am at least <strong style={{ color: 'rgba(255,255,255,0.7)' }}>18 years old</strong>.
                      </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} style={{ accentColor: '#a855f7', width: 16, height: 16, flexShrink: 0, marginTop: 2, cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        I agree to the{' '}
                        <Link to="/terms" target="_blank" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
                        {' '}and{' '}
                        <Link to="/privacy" target="_blank" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>.
                      </span>
                    </label>
                  </div>
                  <button type="submit" className="auth-btn-primary" disabled={isLoading || !agreedTo18 || !agreedToTerms} style={{ marginTop: 6 }}>
                    {isLoading ? 'Creating account…' : 'Create Account'}
                  </button>
                  <div className="auth-divider">or</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button type="button" className="auth-btn-social" onClick={handleGoogleSignIn} disabled={isLoading || !agreedTo18 || !agreedToTerms}>
                      <GoogleIcon /> Continue with Google
                    </button>
                    <button type="button" className="auth-btn-social" disabled>
                      <AppleIcon /> Continue with Apple
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginLeft: 4 }}>Soon</span>
                    </button>
                  </div>
                </form>
              )}

              {/* FORGOT PASSWORD */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {resetSent ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>✉️</div>
                      <h3 style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>Check your email</h3>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
                        We've sent a password reset link. It may take a few minutes to arrive.
                      </p>
                      <button type="button" onClick={() => switchTab('signin')} className="auth-btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>
                        Back to Sign In
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                        Enter your email and we'll send a secure link to reset your password.
                      </p>
                      <div>
                        <label htmlFor="reset-email" className="auth-label">Email address</label>
                        <input id="reset-email" type="email" className="auth-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                      </div>
                      <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                        {isLoading ? 'Sending…' : 'Send Reset Link'}
                      </button>
                      <button type="button" onClick={() => switchTab('signin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, padding: '4px 0' }}>
                        ← Back to Sign In
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', margin: 0 }}>{brand.footerText}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
                <Link to="/trust" style={{ color: 'inherit', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a855f7')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
                >Trust &amp; Privacy</Link>
                <span>·</span>
                <a href={`mailto:${brand.supportEmail}`} style={{ color: 'inherit', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a855f7')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
                >Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
