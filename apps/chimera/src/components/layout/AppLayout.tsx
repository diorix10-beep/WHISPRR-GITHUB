import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMode, type CreativeMode } from '../../contexts/ModeContext';
import { ShardsHubModal } from '../common/ShardsHubModal';

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const NAV: Record<CreativeMode, { to: string; label: string }[]> = {
  roleplay: [
    { to: '/discover', label: 'Discover' },
    { to: '/chats', label: 'Chats' },
    { to: '/guardian', label: "Guardian's Library" },
  ],
  storytelling: [
    { to: '/library', label: 'Library' },
    { to: '/workspace', label: "Writer's Desk" },
    { to: '/guardian', label: "Guardian's Library" },
  ],
};

// Routes that belong to one mode switch the toggle automatically, as before.
const ROLEPLAY_ROUTES = /^(\/discover|\/shards|\/characters|\/chats)/;
const STORYTELLING_ROUTES = /^(\/workspace|\/vellum|\/worlds|\/stories|\/write|\/library)/;

export default function AppLayout() {
  const { user, profile, signOut, shardsBalance, vellumBalance } = useAuth();
  const { mode, setMode } = useMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showShardsHub, setShowShardsHub] = useState(false);

  useEffect(() => {
    if (ROLEPLAY_ROUTES.test(location.pathname)) setMode('roleplay');
    else if (STORYTELLING_ROUTES.test(location.pathname)) setMode('storytelling');
    setMenuOpen(false);
  }, [location.pathname, setMode]);

  useEffect(() => {
    const open = () => setShowShardsHub(true);
    window.addEventListener('open-shards-hub', open);
    return () => window.removeEventListener('open-shards-hub', open);
  }, []);

  const isStory = mode === 'storytelling';
  const reserveLabel = isStory
    ? vellumBalance === null ? (profile ? 'Loading…' : 'VELLUM') : `${formatNumber(vellumBalance)} VELLUM`
    : shardsBalance === null ? (profile ? 'Loading…' : 'SHARDS') : `${formatNumber(shardsBalance)} SHARDS`;

  const links = NAV[mode];

  return (
    <div className="min-h-screen bg-chimera-bg text-chimera-ink font-sans">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-chimera-gold focus:px-4 focus:py-2 focus:text-black">Skip to main content</a>
      <header className="relative z-30 border-b border-chimera-gold/15">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 font-serif text-2xl font-semibold tracking-[0.3em] text-chimera-gold">
            <Sparkles size={24} aria-hidden="true" />
            CHIMERA
          </Link>

          <nav aria-label="Main" className="hidden flex-1 items-center gap-7 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `border-b-2 pb-1 text-[15px] font-medium transition-colors ${isActive ? 'border-chimera-gold text-chimera-gold' : 'border-transparent text-violet-100/80 hover:text-chimera-gold'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <div role="group" aria-label="Mode" className={`flex gap-1 rounded-full border p-1 text-sm font-bold ${isStory ? 'border-chimera-blue/50' : 'border-chimera-gold/40'}`}>
              <button
                type="button"
                aria-pressed={!isStory}
                onClick={() => { setMode('roleplay'); navigate('/discover'); }}
                className={`min-h-[40px] rounded-full px-4 ${!isStory ? 'bg-chimera-rose text-[#1a0c0c]' : 'text-violet-100/80'}`}
              >
                Roleplay
              </button>
              <button
                type="button"
                aria-pressed={isStory}
                onClick={() => { setMode('storytelling'); navigate('/library'); }}
                className={`min-h-[40px] rounded-full px-4 ${isStory ? 'bg-chimera-blue text-[#0b1226]' : 'text-violet-100/80'}`}
              >
                Storytelling
              </button>
            </div>

            {/* Mode-aware creative reserve: real VELLUM in Storytelling, SHARDS in Roleplay. */}
            <button
              onClick={() => navigate(isStory ? '/vellum' : '/shards')}
              aria-label={isStory ? 'Open VELLUM reserve' : 'Open SHARDS reserve'}
              className={`hidden lg:flex min-h-[44px] items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full backdrop-blur-md transition-all font-bold text-xs shadow-lg hover:scale-105 active:scale-95 group shrink-0 ${isStory ? 'bg-[#10213b]/80 hover:bg-[#173050]/90 text-[#f1d9aa] border border-[#c89d57]/50 hover:border-[#f1d9aa]' : 'bg-purple-950/60 hover:bg-purple-900/70 text-amber-200 border border-amber-500/40 hover:border-amber-400 hover:shadow-purple-900/30'}`}
              title={isStory ? 'VELLUM story reserve' : 'SHARDS reserve'}
            >
              <img src={isStory ? '/images/vellum-sigil.svg' : '/images/shards_amethyst_logo.png'} alt={isStory ? 'VELLUM' : 'SHARDS'} className="w-5 h-5 object-contain rounded-md" />
              <span className="hidden sm:inline font-serif font-black text-xs tracking-wide">{reserveLabel}</span>
            </button>

            {user ? (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-chimera-gold to-violet-700 font-bold text-black" aria-label="Your account" title={profile?.display_name ?? user.email ?? ''}>
                  {(profile?.display_name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                </span>
                <button type="button" onClick={() => void signOut()} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Sign out</button>
              </div>
            ) : (
              <Link to="/auth" className="hidden min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 text-sm font-bold hover:bg-chimera-gold/10 sm:inline-flex">Sign in</Link>
            )}

            <button type="button" className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-chimera-gold/40 md:hidden" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Mobile" className="border-t border-chimera-gold/15 px-5 py-4 md:hidden">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.to}><NavLink to={link.to} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-white/5">{link.label}</NavLink></li>
              ))}
              <li><NavLink to={isStory ? '/vellum' : '/shards'} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-white/5">{reserveLabel}</NavLink></li>
              <li>{user ? <button type="button" onClick={() => void signOut()} className="block w-full rounded-xl px-3 py-3 text-left text-base font-medium hover:bg-white/5">Sign out</button> : <NavLink to="/auth" className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-white/5">Sign in</NavLink>}</li>
            </ul>
          </nav>
        )}
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-chimera-gold/15 px-5 py-8 text-sm text-chimera-mute sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-2">
          <Link to="/terms" className="hover:text-chimera-gold">Terms</Link>
          <Link to="/privacy" className="hover:text-chimera-gold">Privacy</Link>
          <Link to="/guardian" className="hover:text-chimera-gold">Guardian&apos;s Library</Link>
          <span className="sm:ml-auto">CHIMERA is in early development.</span>
        </div>
      </footer>

      <ShardsHubModal isOpen={showShardsHub} onClose={() => setShowShardsHub(false)} />
    </div>
  );
}
