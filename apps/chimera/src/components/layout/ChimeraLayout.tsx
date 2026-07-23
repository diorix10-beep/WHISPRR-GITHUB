import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate, NavLink, useLocation, Link } from 'react-router-dom';
import {
  Menu, Sun, Moon, Monitor, Search, Plus, LayoutGrid, Settings, LogOut,
  PenTool, MessageSquare, BookOpen, Globe, Users, Compass, Sparkles, UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';
import { AppLauncherModal } from './AppLauncherModal';
import { MobileNavDrawer } from './MobileNavDrawer';

interface ChimeraLayoutProps {
  children?: ReactNode;
}

interface NavLinkItem {
  path: string;
  label: string;
  icon?: any;
  comingSoon?: boolean;
}

const ROLEPLAY_NAV_LINKS: NavLinkItem[] = [
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/characters', label: 'Characters', icon: Users },
  { path: '/conversations', label: 'Chats', icon: MessageSquare },
  { path: '/personas', label: 'Personas', icon: UserCheck },
  { path: '/studio', label: 'Creator Studio', icon: Sparkles },
];

const STORYTELLING_NAV_LINKS: NavLinkItem[] = [
  { path: '/', label: 'Home', icon: Compass },
  { path: '/write/desk', label: 'Stories', icon: BookOpen },
  { path: '/worlds', label: 'Worlds', icon: Globe },
];

export function ChimeraLayout({ children }: ChimeraLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAppLauncher, setShowAppLauncher] = useState(false);

  const [creativeMode, setCreativeMode] = useState<'roleplay' | 'storytelling'>(() => {
    return (localStorage.getItem('chimera_creative_mode') as 'roleplay' | 'storytelling') || 'roleplay';
  });

  const toggleCreativeMode = (targetMode?: 'roleplay' | 'storytelling') => {
    const nextMode = targetMode || (creativeMode === 'roleplay' ? 'storytelling' : 'roleplay');
    setCreativeMode(nextMode);
    localStorage.setItem('chimera_creative_mode', nextMode);
    
    // Auto-redirect to appropriate home view for active mode
    if (nextMode === 'storytelling') {
      if (location.pathname === '/discover' || location.pathname === '/characters' || location.pathname === '/conversations') {
        navigate('/write/desk');
      }
    } else {
      if (location.pathname === '/' || location.pathname === '/write/desk' || location.pathname === '/worlds') {
        navigate('/discover');
      }
    }
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
    window.addEventListener('open-app-launcher', handleOpenLauncher);
    window.addEventListener('open-mobile-drawer', handleOpenMobileDrawer);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-app-launcher', handleOpenLauncher);
      window.removeEventListener('open-mobile-drawer', handleOpenMobileDrawer);
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
            `relative px-3 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap inline-flex items-center shrink-0 ${
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
          {({ isActive }) => (
            <>
              {link.label}
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
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 transition-colors duration-300 flex flex-col font-sans">
      {/* Top Navigation Header — Exact match to Photo 2 */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-warm-850/95 backdrop-blur-md border-b border-warm-200/70 dark:border-warm-800/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* LEFT: App Launcher & Brand Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-1.5 -ml-1 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setShowAppLauncher(true)}
              className="hidden lg:block p-1.5 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
              title="App Switcher"
            >
              <LayoutGrid size={20} />
            </button>
            
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/chimera_logo.png"
                alt="CHIMERA"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all"
              />
              <span className="font-serif text-lg sm:text-xl font-bold text-red-600 dark:text-red-500 tracking-wide">
                CHIMERA
              </span>
            </Link>
          </div>

          {/* CENTER: Mode-Specific Navigation Links (Zero Overlap!) */}
          <div className="hidden lg:flex flex-1 items-center justify-center mx-4 min-w-0">
            <nav className="flex items-center gap-6 xl:gap-8 shrink-0">
              {renderNavLinks()}
            </nav>
          </div>

          {/* RIGHT: Creative Mode Switch + Search + Create CTA + Theme + Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            
            {/* Creative Mode Switch Pill (Roleplay vs Storytelling) */}
            <div className="flex items-center bg-warm-200/70 dark:bg-warm-800/90 p-0.5 rounded-xl border border-warm-200/90 dark:border-warm-750/90 shadow-inner">
              <button
                onClick={() => toggleCreativeMode('roleplay')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  creativeMode === 'roleplay' 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                    : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
                title="Switch to Roleplay Mode"
              >
                <MessageSquare size={13} />
                <span>Roleplay</span>
              </button>
              <button
                onClick={() => toggleCreativeMode('storytelling')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  creativeMode === 'storytelling' 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                    : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-white'
                }`}
                title="Switch to Storytelling Mode"
              >
                <PenTool size={13} />
                <span>Story</span>
              </button>
            </div>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-850 text-warm-500 hover:border-warm-300 dark:hover:border-warm-650 transition-colors"
            >
              <Search size={16} />
              <span className="hidden xl:block text-xs mr-1">
                {creativeMode === 'storytelling' ? 'Search stories...' : 'Search characters...'}
              </span>
              <kbd className="hidden xl:block text-[10px] bg-warm-200 dark:bg-warm-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </button>

            {/* Mode-Specific Primary CTA */}
            <button
              onClick={() => navigate(creativeMode === 'storytelling' ? '/write/desk' : '/studio')}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md active:scale-[0.98] transition-all ${
                creativeMode === 'storytelling'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-600/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-600/20'
              }`}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>
                {creativeMode === 'storytelling' ? 'Write Story' : 'Create Character'}
              </span>
            </button>

            {/* Theme Toggle */}
            <div className="relative hidden sm:block" ref={themeMenuRef}>
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

            {/* Profile Dropdown */}
            {profile ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
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
