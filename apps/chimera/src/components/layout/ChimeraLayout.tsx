import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate, NavLink, useLocation, Link } from 'react-router-dom';
import {
  Menu, Sun, Moon, Monitor, Search, Plus, LayoutGrid, Settings, LogOut,
  PenTool, MessageSquare, BookOpen, Globe, Users, Compass, Sparkles, UserCheck, Gem
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';
import { AppLauncherModal } from './AppLauncherModal';
import { MobileNavDrawer } from './MobileNavDrawer';
import { ShardsHubModal } from '../common/ShardsHubModal';
import { ShardCrystalImage } from '../common/ShardCrystalImage';
import { useTranslation } from '../../hooks/useTranslation';

interface ChimeraLayoutProps {
  children?: ReactNode;
}

interface NavLinkItem {
  path: string;
  token: string;
  icon?: any;
  comingSoon?: boolean;
}

const ROLEPLAY_NAV_LINKS: NavLinkItem[] = [
  { path: '/discover', token: 'navigation.discover', icon: Compass },
  { path: '/characters', token: 'navigation.characters', icon: Users },
  { path: '/conversations', token: 'navigation.chats', icon: MessageSquare },
  { path: '/personas', token: 'navigation.personas', icon: UserCheck },
  { path: '/characters/new', token: 'navigation.studio', icon: Sparkles },
];

const STORYTELLING_NAV_LINKS: NavLinkItem[] = [
  { path: '/workspace', token: 'navigation.workspace', icon: Sparkles },
  { path: '/stories', token: 'navigation.stories', icon: BookOpen },
  { path: '/worlds', token: 'navigation.worlds', icon: Globe },
];

export function ChimeraLayout({ children }: ChimeraLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, shardsBalance, vellumBalance, chimeraPreferences, updateChimeraPreferences } = useAuth();
  const { preference, setPreference } = useTheme();
  const { t, formatNumber, locale, setLocale, supportedLocales } = useTranslation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const [showShardsHub, setShowShardsHub] = useState(false);
  const [creativeMode, setCreativeMode] = useState<'roleplay' | 'storytelling'>(() => {
    return (localStorage.getItem('chimera_creative_mode') as 'roleplay' | 'storytelling') || 'roleplay';
  });

  useEffect(() => {
    if (!chimeraPreferences) return;
    setCreativeMode(chimeraPreferences.last_creative_mode || chimeraPreferences.default_creative_mode);
  }, [chimeraPreferences?.last_creative_mode, chimeraPreferences?.default_creative_mode]);

  // Deep links and old bookmarks must respect the member's selected creative
  // room too. We do not delete or mutate anything from the other room; we
  // simply return the member to the appropriate home before it is displayed.
  useEffect(() => {
    // Until the persisted preference has arrived, do not let a browser-local
    // fallback redirect a storyteller away from a valid bookmarked workspace.
    if (!chimeraPreferences) return;

    const path = location.pathname;
    const isRoleplayRoute = /^(\/discover|\/shards|\/characters|\/conversations|\/chats|\/chat|\/lorebooks|\/models|\/memory|\/voices|\/media|\/personas|\/studio|\/roleplay|\/create)/.test(path);
    const isStorytellingRoute = /^(\/workspace|\/worlds|\/stories|\/write|\/library)/.test(path);

    if (creativeMode === 'storytelling' && isRoleplayRoute) {
      navigate('/workspace', { replace: true });
    } else if (creativeMode === 'roleplay' && isStorytellingRoute) {
      navigate('/discover', { replace: true });
    }
  }, [chimeraPreferences, creativeMode, location.pathname, navigate]);

  const toggleCreativeMode = (targetMode?: 'roleplay' | 'storytelling') => {
    const nextMode = targetMode || (creativeMode === 'roleplay' ? 'storytelling' : 'roleplay');
    setCreativeMode(nextMode);
    localStorage.setItem('chimera_creative_mode', nextMode);
    updateChimeraPreferences({ last_creative_mode: nextMode }).catch(() => {
      // Navigation remains usable if a transient network failure prevents persistence.
    });
    
    // A mode switch is a deliberate arrival, never a mixed-space view.
    navigate(nextMode === 'storytelling' ? '/workspace' : '/discover');
  };

  const themeMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    // Cmd+K shortcut for search
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    // App launcher custom event listener
    function handleOpenLauncher() {
      setShowAppLauncher(true);
    }
    function handleOpenMobileDrawer() {
      setIsMenuOpen(true);
    }
    function handleOpenShardsHub() {
      setShowShardsHub(true);
    }
    window.addEventListener('open-app-launcher', handleOpenLauncher);
    window.addEventListener('open-mobile-drawer', handleOpenMobileDrawer);
    window.addEventListener('open-shards-hub', handleOpenShardsHub);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-app-launcher', handleOpenLauncher);
      window.removeEventListener('open-mobile-drawer', handleOpenMobileDrawer);
      window.removeEventListener('open-shards-hub', handleOpenShardsHub);
    };
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Keep the browser tab aligned with the creative space the user is in.
  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) return;

    favicon.href = creativeMode === 'storytelling'
      ? '/images/vellum-sigil.svg'
      : '/chimera_logo.png';
  }, [creativeMode]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const currentNavLinks = creativeMode === 'storytelling' ? STORYTELLING_NAV_LINKS : ROLEPLAY_NAV_LINKS;

  const renderNavLinks = (isMobile = false) => (
    <>
      {currentNavLinks.map(link => (
        <NavLink
          key={link.path}
          to={link.comingSoon ? '#' : link.path}
          end={link.path === '/'}
          onClick={link.comingSoon ? (e) => e.preventDefault() : undefined}
          className={({ isActive }) =>
            `relative min-w-0 px-2 py-2 text-xs xl:text-sm font-semibold transition-all whitespace-nowrap inline-flex items-center justify-center ${
              link.comingSoon
                ? 'text-warm-400 dark:text-warm-600 cursor-default opacity-60'
                : isActive
                  ? creativeMode === 'storytelling'
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : 'text-red-600 dark:text-red-400 font-bold'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100'
            } ${isMobile ? 'flex w-full rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800' : ''}`
          }
        >
          {({ isActive }) => {
            const Icon = link.icon;
            return (
              <span className="flex items-center justify-center gap-1.5 w-full">
                {Icon && <Icon size={15} className="shrink-0 opacity-80" />}
                <span>{t(link.token)}</span>
                {link.comingSoon && (
                  <span className="ml-1.5 text-[9px] uppercase tracking-wider font-bold text-warm-400 dark:text-warm-600 bg-warm-100 dark:bg-warm-800 px-1.5 py-0.5 rounded-md">
                    Soon
                  </span>
                )}
                {/* Active underline indicator for desktop */}
                {!isMobile && isActive && !link.comingSoon && (
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-md ${
                    creativeMode === 'storytelling' ? 'bg-purple-600 dark:bg-purple-500' : 'bg-red-600 dark:bg-red-500'
                  }`} />
                )}
              </span>
            );
          }}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className={`min-h-screen bg-transparent transition-colors duration-300 flex flex-col font-sans relative ${creativeMode === 'storytelling' ? 'bg-[#081426]' : ''}`}>
      {creativeMode === 'storytelling' && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-[0.16]"
          style={{ backgroundImage: "linear-gradient(rgba(8,20,38,0.88), rgba(8,20,38,0.94)), url('/images/storytelling-workspace-hero-v1.png')" }}
        />
      )}
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-warm-950/70 dark:bg-warm-950/80 backdrop-blur-2xl border-b border-warm-800/60 shadow-lg transition-colors duration-300">
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* 1. BLOC GAUCHE — Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setShowAppLauncher(true)}
              className="p-2 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
              title="Ecosystem App Switcher"
            >
              <LayoutGrid size={20} />
            </button>
            
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img
                src="/chimera_logo.png"
                alt="CHIMERA"
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow-md group-hover:scale-105 group-hover:drop-shadow-lg transition-all"
              />
              <span className={`font-serif text-base sm:text-xl font-extrabold tracking-wider bg-clip-text text-transparent transition-all duration-300 drop-shadow-sm ${
                creativeMode === 'storytelling'
                  ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400'
                  : 'bg-gradient-to-r from-red-500 via-rose-400 to-amber-400'
              }`}>
                CHIMERA
              </span>
            </Link>
          </div>

          {/* 2. BLOC MILIEU — Clean Fluid Primary Navigation */}
          <div className="hidden lg:flex min-w-0 flex-1 items-center justify-center px-2 xl:px-5">
            <nav className={`grid w-full ${currentNavLinks.length === 5 ? 'max-w-[660px] grid-cols-5' : currentNavLinks.length === 4 ? 'max-w-[540px] grid-cols-4' : 'max-w-[420px] grid-cols-3'} items-center gap-1 rounded-2xl border border-warm-800/50 bg-warm-900/20 p-1 text-center`}>
              {renderNavLinks()}
            </nav>
          </div>

          {/* 3. BLOC DROITE — Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">

            {/* Sélecteur de Langue Mondial (Global Language Picker) */}
            <div className="relative">
              <select
                onChange={(e) => setLocale(e.target.value)}
                value={supportedLocales.some(l => l.code === (locale || 'en')) ? (locale || 'en') : 'en'}
                className="appearance-none bg-warm-200/70 dark:bg-warm-800/90 text-warm-900 dark:text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-warm-200/90 dark:border-warm-750/90 cursor-pointer focus:outline-none hover:bg-warm-300 dark:hover:bg-warm-750 transition-all pr-6"
                title={t('settings.language')}
              >
                {supportedLocales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.code.toUpperCase()}
                  </option>
                ))}
              </select>
              <Globe size={12} className="absolute right-2 top-2.5 pointer-events-none text-warm-500" />
            </div>

            {/* Creative Mode Switch Pill — Responsive on Mobile & Desktop */}
            <div className="flex items-center bg-warm-200/70 dark:bg-warm-800/90 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-warm-200/90 dark:border-warm-750/90 shadow-inner">
              <button
                onClick={() => toggleCreativeMode('roleplay')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-300 ${
                  creativeMode === 'roleplay' 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                    : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
                title={t('common.roleplay')}
              >
                <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{t('common.roleplay')}</span>
              </button>
              <button
                onClick={() => toggleCreativeMode('storytelling')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-300 ${
                  creativeMode === 'storytelling' 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                    : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
                title={t('common.storytelling')}
              >
                <PenTool size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{t('common.story')}</span>
              </button>
            </div>

            {/* Mode-aware creative reserve: real VELLUM in Storytelling, SHARDS in Roleplay. */}
            <button
              onClick={() => navigate(creativeMode === 'storytelling' ? '/workspace' : '/shards')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-all font-bold text-xs shadow-lg hover:scale-105 active:scale-95 group shrink-0 ${creativeMode === 'storytelling' ? 'bg-[#10213b]/80 hover:bg-[#173050]/90 text-[#f1d9aa] border border-[#c89d57]/50 hover:border-[#f1d9aa]' : 'bg-purple-950/60 hover:bg-purple-900/70 text-amber-200 border border-amber-500/40 hover:border-amber-400 hover:shadow-purple-900/30'}`}
              title={creativeMode === 'storytelling' ? 'VELLUM story reserve' : t('navigation.shards_hub')}
            >
              <img src={creativeMode === 'storytelling' ? '/images/vellum-sigil.svg' : '/images/shards_amethyst_logo.png'} alt={creativeMode === 'storytelling' ? 'VELLUM' : 'SHARDS'} className="w-5 h-5 object-contain rounded-md" />
              <span className="font-serif font-black text-xs tracking-wide">{creativeMode === 'storytelling' ? (vellumBalance === null ? 'VELLUM' : `${formatNumber(vellumBalance)} VELLUM`) : `${formatNumber(shardsBalance)} SHARDS`}</span>
            </button>

            {/* Search — icon only, no text label on smaller screens */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-850 text-warm-500 hover:border-warm-300 dark:hover:border-warm-650 transition-colors shrink-0"
              aria-label={t('common.search')}
            >
              <Search size={16} />
            </button>

            {/* Mode-Specific Primary CTA — Identical Fixed Layout width */}
            <button
              onClick={() => navigate(creativeMode === 'storytelling' ? '/stories/new' : '/characters/new')}
              className={`min-w-[125px] justify-center flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-white shadow-md active:scale-[0.98] transition-all shrink-0 ${
                creativeMode === 'storytelling'
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                  : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
              }`}
            >
              <Plus size={16} />
              <span>{t('common.create')}</span>
            </button>

            {/* Theme Toggle */}
            <div className="relative hidden sm:block shrink-0" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                aria-label="Toggle theme menu"
              >
                {preference === 'light' ? <Sun size={18} /> : preference === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-warm-850 rounded-2xl shadow-xl border border-warm-200 dark:border-warm-750 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setPreference(item.id as any);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                          preference === item.id
                            ? 'text-red-600 dark:text-red-400 font-bold bg-warm-100 dark:bg-warm-800'
                            : 'text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800'
                        }`}
                      >
                        <Icon size={14} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile Dropdown — Unclipped with Margin Right */}
            {profile ? (
              <div className="relative shrink-0 mr-1 sm:mr-2" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors focus:outline-none"
                >
                  <Avatar
                    photoUrl={profile.photo_url}
                    emoji={profile.avatar_emoji}
                    size="sm"
                  />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-warm-850 rounded-2xl shadow-xl border border-warm-200 dark:border-warm-750 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-warm-100 dark:border-warm-800">
                      <p className="font-semibold text-xs text-warm-900 dark:text-warm-50 truncate">
                        {profile.display_name || profile.username}
                      </p>
                      <p className="text-[10px] text-warm-400 truncate">@{profile.username}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800"
                      >
                        <Settings size={14} /> Settings
                      </Link>
                    </div>

                    <div className="border-t border-warm-100 dark:border-warm-800 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children || <Outlet context={{ creativeMode }} />}
      </main>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        creativeMode={creativeMode}
        toggleCreativeMode={toggleCreativeMode}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAppLauncher={() => setShowAppLauncher(true)}
      />

      {/* App Launcher Modal */}
      <AppLauncherModal
        isOpen={showAppLauncher}
        onClose={() => setShowAppLauncher(false)}
      />

      {/* Shards Hub Modal & Mobile Sheet */}
      <ShardsHubModal
        isOpen={showShardsHub}
        onClose={() => setShowShardsHub(false)}
      />

      {/* Cmd+K Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-warm-950/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-xl bg-white dark:bg-warm-850 rounded-2xl shadow-2xl border border-warm-200 dark:border-warm-750 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-warm-200 dark:border-warm-750 flex items-center gap-3">
              <Search size={18} className="text-warm-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={creativeMode === 'storytelling' ? "Search stories, books, genres, or authors..." : "Search characters, personas, or chats..."}
                className="w-full bg-transparent border-none text-sm text-warm-900 dark:text-warm-50 focus:outline-none placeholder:text-warm-400"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 px-2 py-1 rounded bg-warm-100 dark:bg-warm-800"
              >
                ESC
              </button>
            </div>
            <div className="p-6 text-center text-xs text-warm-400">
              Type to search across {creativeMode === 'storytelling' ? 'stories, series, authors & world building' : 'characters, personas, scenarios & creators'}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
