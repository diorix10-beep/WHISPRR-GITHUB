import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { 
  X, Compass, Plus, MessageSquare, User, BookOpen, 
  Globe, PenTool, Cpu, Layers, Menu, ArrowLeft, Sun, Moon, Monitor, Users, LayoutGrid,
  Bookmark, Settings, Sparkles
} from 'lucide-react';
import { AppLauncherModal } from './AppLauncherModal';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';

interface ChimeraLayoutProps {
  children?: ReactNode;
}

export function ChimeraLayout({ children }: ChimeraLayoutProps) {
  const navigate = useNavigate();
  const { unreadMessageCount } = useNotifications();
  const { profile } = useAuth();
  const { preference, setPreference } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    
    const handleOpen = () => setIsLauncherOpen(true);
    window.addEventListener('open-app-launcher', handleOpen);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('open-app-launcher', handleOpen);
    };
  }, []);

  const chimeraNavItems = [
    { path: '/', icon: Compass, label: 'Explore Nexus' },
    { path: '/library', icon: Bookmark, label: 'My Library' },
    { path: '/write', icon: PenTool, label: "Writer's Desk" },
    { path: '/roleplay', icon: Sparkles, label: 'Roleplay Nexus' },
    { path: '/chats', icon: MessageSquare, label: 'Roleplay Chats', badge: true },
    { path: '/create', icon: Plus, label: 'CHIMERA Forge' },
    { path: '/lorebooks', icon: BookOpen, label: 'CHIMERA Lorebooks' },
    { path: '/worlds', icon: Globe, label: 'CHIMERA Worlds' },
  ];

  const content = (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 transition-colors duration-300 flex flex-col">
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-warm-200 lg:dark:border-warm-800 lg:bg-white lg:dark:bg-warm-850 z-30">
          <div className="flex flex-col h-full relative">
            {/* Chimera Brand Header */}
            <div className="px-6 py-6 border-b border-warm-100 dark:border-warm-800 flex items-center gap-3">
              <button
                onClick={() => setIsLauncherOpen(true)}
                className="p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500 hover:text-warm-900 transition-colors"
                title="App Launcher"
              >
                <LayoutGrid size={18} />
              </button>
              <img
                src="/nexy_mascot.png"
                alt="Nexy Logo"
                className="w-9 h-9 rounded-xl object-cover border border-red-500/25 chimera-glow-red"
              />
              <div>
                <h1 className="font-serif text-2xl font-bold text-red-650 dark:text-red-500 tracking-wide">
                  CHIMERA
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-warm-500 dark:text-warm-400">
                  Creative Platform
                </p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin" aria-label="Chimera navigation">
              {chimeraNavItems.map(({ path, icon: Icon, label, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400'
                        : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 hover:text-warm-900 dark:hover:text-warm-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                  </div>
                  {badge && unreadMessageCount > 0 && (
                    <span className="w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessageCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Bottom Footer Actions */}
            <div className="p-3 border-t border-warm-100 dark:border-warm-800 flex flex-col gap-3">
              {/* Theme Selector */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {preference === 'light' ? <Sun size={14} /> : preference === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
                    <span>Theme: {preference === 'light' ? 'Light' : preference === 'dark' ? 'Dark' : 'System'}</span>
                  </div>
                  <span className="text-[10px] opacity-60">Change</span>
                </button>
                {showThemeMenu && (
                  <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl shadow-lg p-1 z-50 flex flex-col gap-0.5">
                    <button
                      onClick={() => { setPreference('light'); setShowThemeMenu(false); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-full text-left ${preference === 'light' ? 'bg-red-50 dark:bg-red-950/20 text-red-650' : 'text-warm-700 dark:text-warm-300'}`}
                    >
                      <Sun size={12} /> Light Mode
                    </button>
                    <button
                      onClick={() => { setPreference('dark'); setShowThemeMenu(false); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-full text-left ${preference === 'dark' ? 'bg-red-50 dark:bg-red-950/20 text-red-650' : 'text-warm-700 dark:text-warm-300'}`}
                    >
                      <Moon size={12} /> Dark Mode
                    </button>
                    <button
                      onClick={() => { setPreference('system'); setShowThemeMenu(false); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-full text-left ${preference === 'system' ? 'bg-red-50 dark:bg-red-950/20 text-red-650' : 'text-warm-700 dark:text-warm-300'}`}
                    >
                      <Monitor size={12} /> System Mode
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 hover:scale-102 active:scale-98 transition-all"
              >
                <ArrowLeft size={14} />
                <span>Exit to WHISPRR</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile/Tablet Header */}
        <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-warm-850/80 backdrop-blur-lg border-b border-warm-100 dark:border-warm-800 lg:hidden">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLauncherOpen(true)}
                  className="p-1.5 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-600 dark:text-warm-300 transition-colors"
                  title="App Launcher"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors text-warm-600 dark:text-warm-300"
                  aria-label="Toggle menu"
                >
                  <Menu size={20} />
                </button>
                <h1 className="font-serif text-xl font-bold text-red-650 dark:text-red-500 tracking-wide">
                  CHIMERA
                </h1>
              </div>

              {profile && (
                <button
                  onClick={() => navigate('/profile')}
                  className="p-0.5 rounded-full border border-warm-250 dark:border-warm-700"
                >
                  <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="xs" />
                </button>
              )}
            </div>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black/40 z-40" 
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-warm-850 z-50 p-4 border-r border-warm-200 dark:border-warm-800 flex flex-col justify-between animate-slide-right">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-warm-100 dark:border-warm-800 pb-4">
                      <div className="flex items-center gap-2">
                        <img
                          src="/nexy_mascot.png"
                          alt="Nexy Logo"
                          className="w-8 h-8 rounded-lg object-cover border border-red-500/25 chimera-glow-red"
                        />
                        <span className="font-serif font-bold text-lg text-red-650 dark:text-red-500">CHIMERA</span>
                      </div>
                      <button onClick={() => setIsMenuOpen(false)} className="p-1 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800">
                        <X size={18} />
                      </button>
                    </div>

                    <nav className="flex flex-col gap-1">
                      {chimeraNavItems.map(({ path, icon: Icon, label }) => (
                        <NavLink
                          key={path}
                          to={path}
                          end={path === '/'}
                          onClick={() => setIsMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                              isActive
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400'
                                : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'
                            }`
                          }
                        >
                          <Icon size={18} />
                          <span>{label}</span>
                        </NavLink>
                      ))}
                    </nav>
                  </div>

                  <button
                    onClick={() => { setIsMenuOpen(false); navigate('/'); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20"
                  >
                    <ArrowLeft size={14} />
                    <span>Exit to WHISPRR</span>
                  </button>
                </div>
              </>
            )}
          </header>

          {/* Main Content Render Area */}
          <main className="flex-1 w-full">
            {children || <Outlet />}
          </main>
        </div>
      </div>
      <AppLauncherModal 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
      />
    </div>
  );

  return content;
}
