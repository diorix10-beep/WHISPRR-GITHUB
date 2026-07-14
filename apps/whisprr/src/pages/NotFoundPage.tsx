import { Link } from 'react-router-dom';

// ─── WHISPRR Logo (new brand identity) ───────────────────────────────────────
function WhisprLogo({ size = 36 }: { size?: number }) {
  const id = `wg-404-${size}`;
  return (
    <svg width={size * 2.5} height={size} viewBox="0 0 180 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="WHISPRR" role="img">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M4 10 L16 52 L28 24 L40 52 L52 10" stroke={`url(#${id})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M62 8 L63.8 13.5 L69.5 15.3 L63.8 17.1 L62 22.5 L60.2 17.1 L54.5 15.3 L60.2 13.5 Z" fill="#a855f7" fillOpacity="0.95" />
      <path d="M74 16 L74.9 18.6 L77.5 19.5 L74.9 20.4 L74 23 L73.1 20.4 L70.5 19.5 L73.1 18.6 Z" fill="#c084fc" fillOpacity="0.75" />
      <text x="88" y="48" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="800" fontSize="28" letterSpacing="1.5" fill="white">WHISPRR</text>
    </svg>
  );
}

export default function NotFoundPage() {
  return (
    <>
      <style>{`
        .nf-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #0d0818 0%, #110b22 50%, #0a0a15 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 24px;
          text-align: center;
        }
        @keyframes floatStar {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-12px) scale(1.1); opacity: 0.7; }
        }
        .nf-star { animation: floatStar 4s ease-in-out infinite; }
        .nf-star-2 { animation-delay: 1.5s; }
        .nf-star-3 { animation-delay: 2.8s; }
        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 24px rgba(139,92,246,0.4);
        }
        .nf-btn:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 30px rgba(139,92,246,0.5); }
        .nf-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .nf-btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: white; }
      `}</style>

      <div className="nf-root">
        {/* Floating decorative stars */}
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <span className="nf-star" style={{ position: 'absolute', top: '15%', left: '12%', fontSize: 24, color: '#a855f7' }}>✦</span>
          <span className="nf-star nf-star-2" style={{ position: 'absolute', top: '25%', right: '15%', fontSize: 16, color: '#c084fc' }}>✦</span>
          <span className="nf-star nf-star-3" style={{ position: 'absolute', bottom: '20%', left: '20%', fontSize: 12, color: '#7c3aed' }}>✦</span>
          <span className="nf-star" style={{ position: 'absolute', bottom: '30%', right: '10%', fontSize: 20, color: '#a855f7', animationDelay: '0.8s' }}>✦</span>
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <WhisprLogo size={34} />
        </div>

        {/* 404 number */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{
            fontSize: 'clamp(100px, 20vw, 160px)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.08))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            display: 'block',
            letterSpacing: '-4px',
            userSelect: 'none',
          }}>
            404
          </span>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(100px, 20vw, 160px)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-4px',
            opacity: 0.18,
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}>
            404
          </div>
        </div>

        {/* Message */}
        <h1 style={{ color: 'white', fontWeight: 800, fontSize: 'clamp(20px, 4vw, 28px)', margin: '0 0 12px', letterSpacing: '-0.3px' }}>
          This page doesn't exist
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: '0 0 36px', maxWidth: 380, lineHeight: 1.6 }}>
          The page you're looking for has moved, been deleted, or never existed.
          Let's get you back somewhere familiar.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/feed" className="nf-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Go to Feed
          </Link>
          <Link to="/discover" className="nf-btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Discover Creators
          </Link>
        </div>

        {/* Footer */}
        <p style={{ marginTop: 48, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          © 2025 WHISPRR · The Home of Creators
        </p>
      </div>
    </>
  );
}
