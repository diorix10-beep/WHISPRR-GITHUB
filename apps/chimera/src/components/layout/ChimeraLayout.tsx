import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  X, Plus, MessageSquare, User, BookOpen,
  Globe, PenTool, Cpu, Menu, Sun, Moon, Monitor,
  LayoutDashboard, Users, Mic, Image, Brain,
  ChevronDown, Settings, Search, Command, Sparkles,
  FolderOpen, Layers, Palette, ExternalLink, Grid3X3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';
import { AppLauncherModal } from './AppLauncherModal';

interface ChimeraLayoutProps {
  children?: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
  comingSoon?: boolean;
}

export function ChimeraLayout({ children }: ChimeraLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { preference, setPreference } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    create: true,
    ai: true,
    tools: true,
  });
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
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

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navSections: NavSection[] = [
    {
      title: 'Platform',
      items: [
        { path: '/', icon: LayoutDashboard, label: 'Home' },
        { path: '/discover', icon: Sparkles, label: 'Discover', comingSoon: true },
        { path: '/conversations', icon: MessageSquare, label: 'Chats' },
      ],
    },
    {
      title: 'My Studio',
      items: [
        { path: '/studio', icon: Palette, label: 'Creator Studio' },
        { path: '/characters', icon: Users, label: 'My Characters' },
        { path: '/personas', icon: User, label: 'My Personas' },
        { path: '/worlds', icon: Globe, label: 'World Studio' },
        { path: '/stories', icon: PenTool, label: 'Stories' },
      ],
    },
    {
      title: 'Assets & Tools',
      items: [
        { path: '/lorebooks', icon: BookOpen, label: 'Lorebooks' },
        { path: '/media', icon: Image, label: 'Media Library', comingSoon: true },
        { path: '/voices', icon: Mic, label: 'Voices', comingSoon: true },
        { path: '/models', icon: Cpu, label: 'AI Models' },
        { path: '/memory', icon: Brain, label: 'Memory', comingSoon: true },
      ],
    },
  ];

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.comingSoon ? '#' : item.path}
      end={item.path === '/'}
      onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
      className={({ isActive }) =>
        `group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
          item.comingSoon
            ? 'text-warm-400 dark:text-warm-600 cursor-default'
            : isActive
              ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
              : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 hover:text-warm-900 dark:hover:text-warm-100'
        }`
      }
    >
      <div className="flex items-center gap-2.5">
        <item.icon size={16} strokeWidth={1.8} />
        <span>{item.label}</span>
      </div>
      {item.comingSoon && (
        <span className="text-[9px] uppercase tracking-wider font-bold text-warm-400 dark:text-warm-600 bg-warm-100 dark:bg-warm-800 px-1.5 py-0.5 rounded-md">
          Soon
        </span>
      )}
      {item.badge && item.badge > 0 && (
        <span className="w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  const renderNavSection = (section: NavSection, key: string) => {
    const isExpanded = expandedSections[key] !== false;
    return (
      <div key={key} className="mb-1">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-warm-400 dark:text-warm-500 hover:text-warm-600 dark:hover:text-warm-400 transition-colors"
        >
          <span>{section.title}</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
          />
        </button>
        {isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {section.items.map(renderNavItem)}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full relative">
      {/* CHIMERA Brand Header */}
      <div className="px-5 py-5 border-b border-warm-100 dark:border-warm-800">
        <div className="flex items-center gap-3">
          <img
            src="/nexy_mascot.png"
            alt="CHIMERA"
            className="w-9 h-9 rounded-xl object-cover border border-red-500/25 shadow-sm shadow-red-500/10"
          />
          <div>
            <h1 className="font-serif text-xl font-bold text-red-600 dark:text-red-500 tracking-wide leading-none">
              CHIMERA
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-warm-400 dark:text-warm-500 mt-0.5">
              AI Creation Studio
            </p>
          </div>
        </div>

        {/* Search / Command Palette Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-warm-200 dark:border-warm-750 bg-warm-50 dark:bg-warm-850 text-warm-400 dark:text-warm-500 text-xs hover:border-warm-300 dark:hover:border-warm-650 transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] bg-warm-200 dark:bg-warm-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Quick Create */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => navigate('/characters/new')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-sm shadow-red-500/20 hover:shadow-md hover:shadow-red-500/30 active:scale-[0.98] transition-all"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Character</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto scrollbar-thin" aria-label="Platform navigation">
        {navSections.map((section, i) => renderNavSection(section, ['create', 'ai', 'tools'][i]))}
      </nav>

      {/* Bottom Footer */}
      <div className="p-3 border-t border-warm-100 dark:border-warm-800 space-y-2">
        {/* Theme Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {preference === 'light' ? <Sun size={14} /> : preference === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
              <span>{preference === 'light' ? 'Light' : preference === 'dark' ? 'Dark' : 'System'}</span>
            </div>
          </button>
          {showThemeMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl shadow-lg p-1 z-50 flex flex-col gap-0.5">
              {(['light', 'dark', 'system'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setPreference(mode); setShowThemeMenu(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-full text-left transition-colors ${
                    preference === mode
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-600'
                      : 'text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750'
                  }`}
                >
                  {mode === 'light' ? <Sun size={12} /> : mode === 'dark' ? <Moon size={12} /> : <Monitor size={12} />}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ecosystem Hub */}
        <button
          onClick={() => setShowAppLauncher(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
        >
          <Grid3X3 size={14} />
          <span>Ecosystem Hub</span>
        </button>

        {/* Settings + Profile */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
          {profile && (
            <button
              onClick={() => navigate('/profile')}
              className="p-1.5 rounded-xl border border-warm-200 dark:border-warm-700 hover:border-warm-300 dark:hover:border-warm-600 transition-colors"
            >
              <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="xs" />
            </button>
          )}
        </div>

        {/* Ecosystem Footer */}
        <p className="text-[9px] text-center text-warm-350 dark:text-warm-600 mt-1">
          Part of the <span className="font-semibold">WHISPRR</span> Ecosystem
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 transition-colors duration-300 flex flex-col">
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-warm-200 lg:dark:border-warm-800 lg:bg-white lg:dark:bg-warm-850 z-30">
          {sidebarContent}
        </aside>

        {/* Mobile Header + Drawer */}
        <div className="lg:pl-60 flex flex-col min-h-screen flex-1">
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-warm-850/80 backdrop-blur-lg border-b border-warm-100 dark:border-warm-800 lg:hidden">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors text-warm-600 dark:text-warm-300"
                  aria-label="Toggle menu"
                >
                  <Menu size={20} />
                </button>
                <h1 className="font-serif text-lg font-bold text-red-600 dark:text-red-500 tracking-wide">
                  CHIMERA
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors text-warm-500"
                >
                  <Search size={18} />
                </button>
                {profile && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="p-0.5 rounded-full border border-warm-250 dark:border-warm-700"
                  >
                    <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="xs" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/40 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-warm-850 z-50 border-r border-warm-200 dark:border-warm-800 animate-slide-right">
                  {sidebarContent}
                </div>
              </>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 w-full">
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Search Overlay (Command Palette) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[9999] bg-warm-950/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
          <div className="w-full max-w-lg bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-750 shadow-2xl overflow-hidden">
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
