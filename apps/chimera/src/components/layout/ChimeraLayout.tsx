import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate, NavLink, useLocation, Link } from 'react-router-dom';
import {
  Menu, Sun, Moon, Monitor, Search, Command, Plus, Sparkles, Grid3X3, Settings, LogOut,
  Palette, Users, Globe, PenTool, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';
import { AppLauncherModal } from './AppLauncherModal';

interface ChimeraLayoutProps {
  children?: ReactNode;
}

const ROLEPLAY_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/characters', label: 'Characters' },
  { path: '/conversations', label: 'Chats' },
  { path: '/studio', label: 'Creator Studio' },
];

const STORYTELLING_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/stories', label: 'Stories' },
  { path: '/worlds', label: 'Worlds' },
  { path: '/studio', label: 'Creator Studio' },
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

  const toggleCreativeMode = () => {
    const newMode = creativeMode === 'roleplay' ? 'storytelling' : 'roleplay';
    setCreativeMode(newMode);
    localStorage.setItem('chimera_creative_mode', newMode);
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
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

  const renderNavLinks = (isMobile = false) => (
    <>
      {(creativeMode === 'roleplay' ? ROLEPLAY_LINKS : STORYTELLING_LINKS).map(link => (
        <NavLink
          key={link.path}
          to={link.comingSoon ? '#' : link.path}
          end={link.path === '/'}
          onClick={link.comingSoon ? (e) => e.preventDefault() : undefined}
          className={({ isActive }) =>
            `relative px-3 py-2 text-sm font-medium transition-colors ${
              link.comingSoon
                ? 'text-warm-400 dark:text-warm-600 cursor-default'
                : isActive
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100'
            } ${isMobile ? 'block w-full rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              {link.label}
              {link.comingSoon && (
                <span className="ml-2 text-[9px] uppercase tracking-wider font-bold text-warm-400 dark:text-warm-600 bg-warm-100 dark:bg-warm-800 px-1.5 py-0.5 rounded-md">
                  Soon
                </span>
              )}
              {/* Active underline indicator for desktop */}
              {!isMobile && isActive && !link.comingSoon && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 dark:bg-red-500 rounded-t-md" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 transition-colors duration-300 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-warm-850/90 backdrop-blur-md border-b border-warm-200 dark:border-warm-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/nexy_mascot.png"
                alt="CHIMERA"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-red-500/25 shadow-sm shadow-red-500/10 group-hover:shadow-md transition-shadow"
              />
              <span className="font-serif text-lg sm:text-xl font-bold text-red-600 dark:text-red-500 tracking-wide hidden sm:block">
                CHIMERA
              </span>
            </Link>
          </div>

          {/* Center: Dynamic Links & Global Mode Switch */}
          <div className="hidden lg:flex flex-1 items-center justify-between mx-8">
            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              {renderNavLinks()}
            </nav>

            {/* Global Creative Mode Switch */}
            <div className="flex items-center bg-warm-100 dark:bg-warm-800 p-1 rounded-xl shadow-inner border border-warm-200 dark:border-warm-750">
              <button
                onClick={() => creativeMode !== 'roleplay' && toggleCreativeMode()}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  creativeMode === 'roleplay' 
                    ? 'bg-white dark:bg-warm-900 text-red-600 dark:text-red-400 shadow-sm' 
                    : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                <MessageSquare size={14} /> AI Roleplay
              </button>
              <button
                onClick={() => creativeMode !== 'storytelling' && toggleCreativeMode()}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  creativeMode === 'storytelling' 
                    ? 'bg-white dark:bg-warm-900 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                <PenTool size={14} /> Storytelling
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-850 text-warm-500 hover:border-warm-300 dark:hover:border-warm-650 transition-colors"
            >
              <Search size={16} />
              <span className="hidden md:block text-sm mr-4">Search...</span>
              <kbd className="hidden md:block text-[10px] bg-warm-200 dark:bg-warm-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </button>

            {/* Create Button */}
            <button
              onClick={() => navigate('/characters/new')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-sm shadow-red-500/20 active:scale-[0.98] transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:block">Create</span>
            </button>

            {/* Theme Toggle */}
            <div className="relative hidden sm:block" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-xl text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
              >
                {preference === 'light' ? <Sun size={18} /> : preference === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl shadow-lg p-1 z-50 flex flex-col gap-0.5">
                  {(['light', 'dark', 'system'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setPreference(mode); setShowThemeMenu(false); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-full text-left transition-colors ${
                        preference === mode
                          ? 'bg-red-50 dark:bg-red-950/20 text-red-600'
                          : 'text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750'
                      }`}
                    >
                      {mode === 'light' ? <Sun size={14} /> : mode === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile */}
            {profile && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-0.5 rounded-full border border-warm-200 dark:border-warm-700 hover:border-red-400 dark:hover:border-red-500 transition-colors"
                >
                  <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="sm" />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl shadow-lg py-1.5 z-50 flex flex-col">
                    <div className="px-4 py-2 border-b border-warm-100 dark:border-warm-750 mb-1">
                      <p className="text-sm font-semibold text-warm-900 dark:text-warm-100 truncate">
                        {profile.display_name}
                      </p>
                      <p className="text-xs text-warm-500 dark:text-warm-400 truncate">
                        @{profile.username}
                      </p>
                    </div>
                    <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750 w-full text-left">
                      <Settings size={16} /> Profile & Settings
                    </button>
                    <button onClick={() => { setShowProfileMenu(false); setShowAppLauncher(true); }} className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750 w-full text-left">
                      <Grid3X3 size={16} /> WHISPRR Ecosystem
                    </button>
                    <div className="h-px bg-warm-100 dark:bg-warm-750 my-1" />
                    <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-warm-850 z-50 border-r border-warm-200 dark:border-warm-800 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-warm-200 dark:border-warm-800 flex justify-between items-center">
                <span className="font-serif text-lg font-bold text-red-600 dark:text-red-500">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-warm-500"><X size={20} /></button>
              </div>

              {/* Mobile Mode Toggle */}
              <div className="p-4 border-b border-warm-100 dark:border-warm-800 bg-warm-50 dark:bg-warm-900/50">
                <div className="text-[10px] uppercase font-bold tracking-widest text-warm-400 mb-2">Creative Mode</div>
                <div className="flex bg-warm-200 dark:bg-warm-800 p-1 rounded-xl">
                  <button
                    onClick={() => creativeMode !== 'roleplay' && toggleCreativeMode()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                      creativeMode === 'roleplay' ? 'bg-white dark:bg-warm-900 text-red-600 dark:text-red-400 shadow-sm' : 'text-warm-500'
                    }`}
                  >
                    <MessageSquare size={14} /> Roleplay
                  </button>
                  <button
                    onClick={() => creativeMode !== 'storytelling' && toggleCreativeMode()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                      creativeMode === 'storytelling' ? 'bg-white dark:bg-warm-900 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-warm-500'
                    }`}
                  >
                    <PenTool size={14} /> Story
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {renderNavLinks(true)}
                
                <div className="my-4 h-px bg-warm-200 dark:bg-warm-800" />
                
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-bold text-warm-400 uppercase tracking-wider">Theme</div>
                  <div className="flex gap-2 px-3 pb-2">
                    {(['light', 'dark', 'system'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setPreference(mode)}
                        className={`flex-1 p-2 flex justify-center rounded-lg border ${preference === mode ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950' : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400'}`}
                      >
                        {mode === 'light' ? <Sun size={16} /> : mode === 'dark' ? <Moon size={16} /> : <Monitor size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:py-10">
        {children || <Outlet />}
      </main>

      {/* Search Overlay (Command Palette) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[9999] bg-warm-950/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
          <div className="w-full max-w-lg bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-100 dark:border-warm-800">
              <Search size={18} className="text-warm-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search characters, worlds, stories..."
                className="flex-1 bg-transparent text-sm text-warm-900 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none"
              />
              <kbd
                onClick={() => setSearchOpen(false)}
                className="text-[10px] bg-warm-100 dark:bg-warm-750 text-warm-500 px-2 py-1 rounded font-mono cursor-pointer hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors"
              >
                ESC
              </kbd>
            </div>
            <div className="p-4 text-center text-warm-400 dark:text-warm-500 text-sm py-12">
              <Command size={24} className="mx-auto mb-3 opacity-40" />
              <p>Start typing to search across your creations</p>
              <p className="text-xs mt-1 text-warm-300 dark:text-warm-600">Characters · Worlds · Stories · Lorebooks</p>
            </div>
          </div>
        </div>
      )}

      {/* App Launcher / Ecosystem Hub Modal */}
      <AppLauncherModal isOpen={showAppLauncher} onClose={() => setShowAppLauncher(false)} />
    </div>
  );
}
