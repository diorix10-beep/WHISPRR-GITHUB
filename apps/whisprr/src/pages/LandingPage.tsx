import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// ─── Brand Logo ───────────────────────────────────────────────────────────────
function WhisprLogo({ size = 36 }: { size?: number }) {
  const id = `wg-lp-${size}`;
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

function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <span style={{ position: 'absolute', color: '#a855f7', pointerEvents: 'none', userSelect: 'none', ...style }}>
      ✦
    </span>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)',
        border: hovered ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '28px 24px',
        transition: 'all 0.25s ease',
        cursor: 'default',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(168,85,247,0.15)' : 'none',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ color: 'white', fontWeight: 700, fontSize: 17, margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{desc}</p>
    </div>
  );
}

function CreatorPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 18px',
      borderRadius: 100,
      background: 'rgba(168,85,247,0.1)',
      border: '1px solid rgba(168,85,247,0.25)',
      color: '#d8b4fe',
      fontSize: 14,
      fontWeight: 600,
      fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap' as const,
    }}>
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

function FeedCard({ avatar, name, handle, content, reactions }: {
  avatar: string; name: string; handle: string; content: string; reactions: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '20px',
      backdropFilter: 'blur(10px)',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>{avatar}</div>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{name}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{handle}</p>
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>{content}</p>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>{reactions}</p>
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const chimeraUrl = isLocalhost ? 'http://localhost:5174' : 'https://chimera.whisprr.xyz';

  const navBg = scrollY > 60 ? 'rgba(10,8,20,0.92)' : 'transparent';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .lp-root {
          min-height: 100vh;
          background: #0a0814;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: white;
          overflow-x: hidden;
        }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-18px) rotate(5deg); opacity: 0.9; }
        }
        @keyframes lp-float2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-12px) scale(1.1); opacity: 0.65; }
        }
        @keyframes lp-glow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }
        @keyframes lp-slide-up {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-sp1 { animation: lp-float 7s ease-in-out infinite; }
        .lp-sp2 { animation: lp-float 9s ease-in-out infinite 1.5s; }
        .lp-sp3 { animation: lp-float2 11s ease-in-out infinite 3s; }
        .lp-sp4 { animation: lp-float2 8s ease-in-out infinite 0.8s; }
        .lp-sp5 { animation: lp-float 6s ease-in-out infinite 2s; }
        .lp-a1 { animation: lp-slide-up 0.8s ease both; }
        .lp-a2 { animation: lp-slide-up 0.8s ease 0.15s both; }
        .lp-a3 { animation: lp-slide-up 0.8s ease 0.3s both; }
        .lp-btn-p {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none; border-radius: 14px;
          color: white; font-size: 16px; font-weight: 700;
          font-family: inherit; cursor: pointer; text-decoration: none;
          transition: all 0.2s ease; white-space: nowrap;
          box-shadow: 0 4px 28px rgba(168,85,247,0.45);
        }
        .lp-btn-p:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 36px rgba(168,85,247,0.55); }
        .lp-btn-g {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14); border-radius: 14px;
          color: rgba(255,255,255,0.85); font-size: 15px; font-weight: 600;
          font-family: inherit; cursor: pointer; text-decoration: none;
          transition: all 0.2s ease; white-space: nowrap;
        }
        .lp-btn-g:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); color: white; transform: translateY(-1px); }
        .lp-gt {
          background: linear-gradient(135deg, #c084fc 0%, #a855f7 40%, #818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-sec { padding: 96px 24px; }
        .lp-con { max-width: 1100px; margin: 0 auto; }
        .lp-nl { color: rgba(255,255,255,0.65); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .lp-nl:hover { color: white; }
        .lp-fg { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .lp-ec { flex: 1; min-width: 280px; border-radius: 28px; padding: 40px 36px; backdrop-filter: blur(16px); transition: transform 0.3s ease; }
        .lp-ec:hover { transform: translateY(-6px); }
        @media (max-width: 768px) {
          .lp-sec { padding: 64px 20px; }
          .lp-ecw { flex-direction: column !important; }
          .lp-ec { min-width: 0 !important; }
          .lp-h1 { font-size: clamp(38px, 12vw, 96px) !important; }
        }
      `}</style>

      <div className="lp-root">

        {/* Atmospheric BG */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-10%', left: '20%',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)',
            animation: 'lp-glow 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '5%', right: '10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
            animation: 'lp-glow 12s ease-in-out infinite 3s',
          }} />
          <div style={{
            position: 'absolute', top: '40%', left: '-5%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
            animation: 'lp-glow 10s ease-in-out infinite 6s',
          }} />
        </div>

        {/* Nav */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 24px',
          background: navBg,
          borderBottom: scrollY > 60 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          backdropFilter: scrollY > 60 ? 'blur(20px)' : 'none',
          transition: 'all 0.3s ease',
        }}>
          <div className="lp-con" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
            <WhisprLogo size={28} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <a href="#ecosystem" className="lp-nl">Ecosystem</a>
              <a href="#creators" className="lp-nl">Creators</a>
              <a href="#features" className="lp-nl">Features</a>
              <a href={chimeraUrl} className="lp-nl" target="_blank" rel="noopener noreferrer">CHIMERA ↗</a>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/auth" className="lp-btn-g" style={{ padding: '9px 20px', fontSize: 14 }}>Sign In</Link>
              <Link to="/auth" className="lp-btn-p" style={{ padding: '9px 20px', fontSize: 14 }}>Join Free</Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section ref={heroRef} style={{
          position: 'relative', zIndex: 1,
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 24px 80px',
        }}>
          <span className="lp-sp1" style={{ position: 'absolute', top: '18%', left: '8%', fontSize: 22, color: '#a855f7', opacity: 0.6, pointerEvents: 'none' }}>✦</span>
          <span className="lp-sp2" style={{ position: 'absolute', top: '30%', right: '9%', fontSize: 14, color: '#a855f7', opacity: 0.5, pointerEvents: 'none' }}>✦</span>
          <span className="lp-sp3" style={{ position: 'absolute', top: '12%', left: '35%', fontSize: 10, color: '#c084fc', opacity: 0.4, pointerEvents: 'none' }}>✦</span>
          <span className="lp-sp4" style={{ position: 'absolute', bottom: '28%', left: '12%', fontSize: 18, color: '#a855f7', opacity: 0.5, pointerEvents: 'none' }}>✦</span>
          <span className="lp-sp5" style={{ position: 'absolute', bottom: '32%', right: '14%', fontSize: 12, color: '#c084fc', opacity: 0.4, pointerEvents: 'none' }}>✦</span>

          <div className="lp-con" style={{ maxWidth: 860 }}>
            {/* Badge */}
            <div className="lp-a1" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 16px', borderRadius: 100,
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.3)',
              marginBottom: 32, fontSize: 13, fontWeight: 600,
              color: '#d8b4fe',
            }}>
              <span style={{ fontSize: 14 }}>✦</span>
              Now in Early Access — Join thousands of creators
            </div>

            <h1 className="lp-a1 lp-h1" style={{
              fontSize: 'clamp(52px, 9vw, 96px)',
              fontWeight: 900, lineHeight: 1.05,
              margin: '0 0 12px', letterSpacing: '-2px',
            }}>
              The Home
            </h1>
            <h1 className="lp-a1" style={{
              fontSize: 'clamp(52px, 9vw, 96px)',
              fontWeight: 900, lineHeight: 1.05,
              margin: '0 0 32px', letterSpacing: '-2px',
              background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              of Creators.
            </h1>

            <p className="lp-a2" style={{
              fontSize: 'clamp(17px, 2.5vw, 22px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.65, margin: '0 auto 48px', maxWidth: 620, fontWeight: 400,
            }}>
              WHISPRR is where creators connect, discover each other, share their work,
              and build communities. From AI roleplay to original fiction — your creative world starts here.
            </p>

            <div className="lp-a3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/auth" className="lp-btn-p">
                ✦ Join WHISPRR Free
              </Link>
              <a href={chimeraUrl} className="lp-btn-g" target="_blank" rel="noopener noreferrer">
                Explore CHIMERA →
              </a>
            </div>

            <p style={{ marginTop: 40, fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              Writers · Worldbuilders · AI Creators · Character Designers · Storytellers
            </p>
          </div>

          <div style={{
            position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.25)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' }}>SCROLL</span>
            <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(168,85,247,0.6), transparent)' }} />
          </div>
        </section>

        {/* ECOSYSTEM */}
        <section id="ecosystem" className="lp-sec" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-con">
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#a855f7', marginBottom: 16, textTransform: 'uppercase' }}>
              The Ecosystem
            </p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15 }}>
              Two products. One universe.
            </h2>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 17, margin: '0 auto 64px', maxWidth: 520, lineHeight: 1.6 }}>
              WHISPRR and CHIMERA are separate products that share one identity —
              one login, one profile, one creative ecosystem.
            </p>

            <div className="lp-ecw" style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
              {/* WHISPRR card */}
              <div className="lp-ec" style={{
                background: 'linear-gradient(145deg, rgba(168,85,247,0.12) 0%, rgba(124,58,237,0.06) 100%)',
                border: '1px solid rgba(168,85,247,0.3)',
                boxShadow: '0 0 60px rgba(168,85,247,0.08)',
              }}>
                <div style={{ marginBottom: 24 }}>
                  <svg width="44" height="44" viewBox="0 0 52 52" fill="none">
                    <defs>
                      <linearGradient id="eco-wl" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <path d="M2 8 L12 44 L22 20 L32 44 L42 8" stroke="url(#eco-wl)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M47 3 L48.2 6.8 L52 8 L48.2 9.2 L47 13 L45.8 9.2 L42 8 L45.8 6.8 Z" fill="#a855f7" fillOpacity="0.9" />
                  </svg>
                </div>
                <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', fontSize: 11, fontWeight: 700, color: '#d8b4fe', marginBottom: 16, letterSpacing: '0.08em' }}>
                  WHISPRR
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Where creators connect.</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
                  Your social home as a creator. Discover fellow writers, share your work, join creative communities, collaborate on projects, and build real connections with people who understand your craft.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['Creator feed & discovery', 'Creative communities', 'Collaboration requests', 'Share stories & characters', 'Follow your favourite creators'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      <span style={{ color: '#a855f7', fontSize: 16 }}>✦</span> {item}
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="lp-btn-p" style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                  Join WHISPRR
                </Link>
              </div>

              {/* Connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 8px', flexShrink: 0 }}>
                <div style={{ width: 1, flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(168,85,247,0.4), rgba(99,102,241,0.4), transparent)' }} />
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                  +
                </div>
                <div style={{ width: 1, flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.4), rgba(168,85,247,0.4), transparent)' }} />
              </div>

              {/* CHIMERA card */}
              <div className="lp-ec" style={{
                background: 'linear-gradient(145deg, rgba(99,102,241,0.1) 0%, rgba(79,70,229,0.06) 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 0 60px rgba(99,102,241,0.08)',
              }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🔮
                  </div>
                </div>
                <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, fontWeight: 700, color: '#a5b4fc', marginBottom: 16, letterSpacing: '0.08em' }}>
                  CHIMERA
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Where Stories Come to Life.</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
                  CHIMERA is where creators imagine, write, roleplay, build worlds, design characters, and bring stories to life. Whether you create by hand, with AI, or somewhere in between, CHIMERA is the place where imagination becomes reality.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['Character creation & roleplay', 'World & universe building', 'Story writing platform', 'Lorebook & lore management', 'Advanced creative tools'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      <span style={{ color: '#6366f1', fontSize: 16 }}>✦</span> {item}
                    </li>
                  ))}
                </ul>
                <a href={chimeraUrl} className="lp-btn-g" style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(99,102,241,0.4)', boxSizing: 'border-box' }} target="_blank" rel="noopener noreferrer">
                  Explore CHIMERA →
                </a>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: '#a855f7' }}>✦</span>
              One account, one profile — sign in once, access everything.
              <span style={{ color: '#a855f7' }}>✦</span>
            </p>
          </div>
        </section>

        {/* CREATOR TYPES */}
        <section id="creators" className="lp-sec" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-con">
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#a855f7', marginBottom: 16, textTransform: 'uppercase' }}>
              For Every Creator
            </p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1px' }}>
              Built for your kind of creativity.
            </h2>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: '0 auto 52px', maxWidth: 480, lineHeight: 1.6 }}>
              Whether you write by hand, with AI, or somewhere in between — WHISPRR is your home.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 64 }}>
              <CreatorPill emoji="✍️" label="Writers" />
              <CreatorPill emoji="🌍" label="Worldbuilders" />
              <CreatorPill emoji="🎭" label="AI Roleplay Creators" />
              <CreatorPill emoji="📖" label="Storytellers" />
              <CreatorPill emoji="🧙" label="Character Designers" />
              <CreatorPill emoji="📚" label="Lore Writers" />
              <CreatorPill emoji="🎨" label="Creative Directors" />
              <CreatorPill emoji="🤝" label="Collaborators" />
              <CreatorPill emoji="🌌" label="Fantasy Creators" />
              <CreatorPill emoji="🔬" label="Sci-Fi Builders" />
              <CreatorPill emoji="💬" label="Community Builders" />
              <CreatorPill emoji="⚡" label="Prompt Engineers" />
            </div>

            {/* Feed preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              <FeedCard
                avatar="✍️"
                name="Luna Voss"
                handle="@lunavoss · 2m ago"
                content="Just finished chapter 14 of Eclipse of Tomorrow. The villain's backstory rewrote itself and I'm not even mad. Sometimes the story knows better. ✨ Sharing the first pages soon!"
                reactions="❤️ 94  💬 18  ✦ 6"
              />
              <FeedCard
                avatar="🌍"
                name="Marcus Reid"
                handle="@marcusreid · 15m ago"
                content="Built a new magic system for The Lost Realms. It's entropy-based — the more you use it, the more ordered the world becomes. Working with @aetheria on the lore rules right now!"
                reactions="❤️ 142  💬 33  ✦ 12"
              />
              <FeedCard
                avatar="🎭"
                name="Aetheria"
                handle="@aetheria · 1h ago"
                content="Looking for a co-writer for a sci-fi roleplay world. Built 3 AI characters and a station setting in CHIMERA already — need someone for the political intrigue angle. DM me!"
                reactions="❤️ 57  💬 24 · 3 interested"
              />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="lp-sec" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-con">
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#a855f7', marginBottom: 16, textTransform: 'uppercase' }}>
              Platform Features
            </p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800, margin: '0 0 56px', letterSpacing: '-1px' }}>
              Where creators belong, collaborate, and grow together.
            </h2>
            <div className="lp-fg">
              <FeatureCard icon="🌊" title="Creator Feed" desc="Discover what creators are building today through stories, characters, worlds, lorebooks, progress updates and creative posts." />
              <FeatureCard icon="🔭" title="Discover" desc="Discover creators, communities, stories, characters, worlds and lorebooks from across the ecosystem." />
              <FeatureCard icon="👥" title="Communities" desc="Creative communities where creators share ideas, build friendships, discuss anything respectfully and collaborate together." />
              <FeatureCard icon="🤝" title="Collaboration Hub" desc="Find writers, editors, prompt engineers, worldbuilders, artists and other creators for your projects." />
              <FeatureCard icon="📢" title="Share Creations" desc="Publish stories, characters, worlds and lorebooks created in CHIMERA directly to your WHISPRR profile and communities." />
              <FeatureCard icon="💬" title="Private Messages" desc="Chat privately, share creations and coordinate collaborations with other creators." />
              <FeatureCard icon="👤" title="Creator Profiles" desc="Showcase your stories, characters, worlds, lorebooks, communities and current creative projects." />
              <FeatureCard icon="✦" title="One Ecosystem" desc="Create in CHIMERA. Connect in WHISPRR. Both applications work together as one creator ecosystem." />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-sec" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-con">
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#a855f7', marginBottom: 16, textTransform: 'uppercase' }}>
              How It Works
            </p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800, margin: '0 0 64px', letterSpacing: '-1px' }}>
              Create. Share. Connect.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0 }}>
              {[
                { step: '01', title: 'Create your profile', desc: 'Sign up with a single account that works across the entire WHISPRR ecosystem.' },
                { step: '02', title: 'Discover creators', desc: 'Explore the feed, search by interests, and find communities that match your creative world.' },
                { step: '03', title: 'Share your work', desc: 'Post updates, share stories from CHIMERA, and let your creative output speak for itself.' },
                { step: '04', title: 'Build together', desc: 'Collaborate with other creators, join communities, and help each other grow as artists.' },
              ].map((item, i) => (
                <div key={item.step} style={{
                  padding: '36px 28px',
                  background: i % 2 === 0 ? 'rgba(168,85,247,0.04)' : 'rgba(99,102,241,0.04)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: i === 0 ? '20px 0 0 20px' : i === 3 ? '0 20px 20px 0' : 0,
                }}>
                  <p style={{ fontSize: 42, fontWeight: 900, color: 'rgba(168,85,247,0.2)', margin: '0 0 16px', letterSpacing: '-2px', fontFamily: 'Inter, sans-serif' }}>
                    {item.step}
                  </p>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: 'white', fontFamily: 'Inter, sans-serif' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHIMERA TEASER */}
        <section className="lp-sec" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-con">
            <div style={{
              borderRadius: 32,
              background: 'linear-gradient(145deg, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.06) 50%, rgba(168,85,247,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
              padding: 'clamp(40px, 6vw, 72px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 24, fontSize: 12, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.08em' }}>
                🔮 CHIMERA — Creative Platform
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1px' }}>
                Where stories<br />
                <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  come to life.
                </span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '0 auto 40px', maxWidth: 520, lineHeight: 1.7 }}>
                CHIMERA is where creators imagine, write, roleplay, build worlds, design characters, and bring stories to life. Whether you create by hand, with AI, or somewhere in between, CHIMERA is the place where imagination becomes reality.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href={chimeraUrl} className="lp-btn-p" style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }} target="_blank" rel="noopener noreferrer">
                  Explore CHIMERA
                </a>
                <Link to="/auth" className="lp-btn-g">
                  Join WHISPRR first →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-sec" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="lp-con" style={{ maxWidth: 680 }}>
            <span className="lp-sp1" style={{ position: 'absolute', top: 20, left: '15%', fontSize: 20, color: '#a855f7', opacity: 0.5, pointerEvents: 'none' }}>✦</span>
            <span className="lp-sp3" style={{ position: 'absolute', top: 30, right: '18%', fontSize: 14, color: '#c084fc', opacity: 0.4, pointerEvents: 'none' }}>✦</span>
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-2px', lineHeight: 1.1 }}>
                Your creative home{' '}
                <span style={{ background: 'linear-gradient(135deg, #c084fc, #a855f7, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  is waiting.
                </span>
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', margin: '0 auto 44px', maxWidth: 440, lineHeight: 1.6 }}>
                Join creators who are already connecting, sharing, and building on WHISPRR.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/auth" className="lp-btn-p" style={{ fontSize: 17, padding: '16px 36px' }}>
                  ✦ Start Creating — It's Free
                </Link>
              </div>
              <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
                No credit card required · Free to join · Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 32px' }}>
          <div className="lp-con">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', marginBottom: 40 }}>
              <div style={{ maxWidth: 280 }}>
                <WhisprLogo size={28} />
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 14, lineHeight: 1.6 }}>
                  The Home of Creators. Where writers, worldbuilders, and AI creators connect and build together.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Platform</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Link to="/auth" className="lp-nl" style={{ fontSize: 13 }}>Join WHISPRR</Link>
                    <a href={chimeraUrl} className="lp-nl" style={{ fontSize: 13 }} target="_blank" rel="noopener noreferrer">Explore CHIMERA</a>
                    <Link to="/discover" className="lp-nl" style={{ fontSize: 13 }}>Discover Creators</Link>
                    <Link to="/communities" className="lp-nl" style={{ fontSize: 13 }}>Communities</Link>
                  </div>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Legal</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Link to="/privacy" className="lp-nl" style={{ fontSize: 13 }}>Privacy Policy</Link>
                    <Link to="/terms" className="lp-nl" style={{ fontSize: 13 }}>Terms of Service</Link>
                    <Link to="/guidelines" className="lp-nl" style={{ fontSize: 13 }}>Community Guidelines</Link>
                    <Link to="/trust" className="lp-nl" style={{ fontSize: 13 }}>Trust & Safety</Link>
                  </div>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Company</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Link to="/careers" className="lp-nl" style={{ fontSize: 13 }}>Careers</Link>
                    <Link to="/community-program" className="lp-nl" style={{ fontSize: 13 }}>Community Program</Link>
                    <a href="mailto:hello@whisprr.xyz" className="lp-nl" style={{ fontSize: 13 }}>Contact</a>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                © 2025 WHISPRR. The Home of Creators.
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#a855f7', fontSize: 10 }}>✦</span>
                Built with love for creators everywhere
                <span style={{ color: '#a855f7', fontSize: 10 }}>✦</span>
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
