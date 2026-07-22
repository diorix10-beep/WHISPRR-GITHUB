import { useState, useEffect, type ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, X, LayoutGrid, Menu } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../common/Logo';
import { Avatar } from '../common/Avatar';
import { AppLauncherModal } from './AppLauncherModal';
import { ChimeraPromoModal } from '../modals/ChimeraPromoModal';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { profile, signOut, systemSettings } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isChimeraPromoOpen, setIsChimeraPromoOpen] = useState(false);

  useEffect(() => {
    const handleOpenLauncher = () => setIsLauncherOpen(true);
    const handleOpenChimeraPromo = () => setIsChimeraPromoOpen(true);
    
    window.addEventListener('open-app-launcher', handleOpenLauncher);
    window.addEventListener('open-chimera-promo', handleOpenChimeraPromo);
    
    return () => {
      window.removeEventListener('open-app-launcher', handleOpenLauncher);
      window.removeEventListener('open-chimera-promo', handleOpenChimeraPromo);
    };
  }, []);

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 transition-colors duration-300 flex flex-col">
      {/* Founder Mode Indicator Banner */}
      {systemSettings?.enabled && isBannerVisible && (
        <div className="bg-primary-600 dark:bg-primary-950 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between z-50 relative animate-slide-down border-b border-primary-500/25 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">🧪</span>
            <span>Founder Testing Mode — Maintenance Bypass Enabled (Regular users are blocked)</span>
          </div>
          <div className="flex items-center gap-3">
            {profile?.role === 'founder' && (
              <button 
                onClick={() => navigate('/founder')}
                className="underline hover:text-warm-200 transition-colors mr-1"
              >
                Founder Panel →
              </button>
            )}
            <button 
              onClick={() => setIsBannerVisible(false)}
              className="hover:text-warm-205 transition-colors p-0.5 rounded-full hover:bg-white/10"
              aria-label="Hide indicator"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 relative">
        {/* Desktop sidebar (hidden on mobile) */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-warm-200 lg:dark:border-warm-700 lg:bg-white lg:dark:bg-warm-800 z-30">
        <SideNav />
      </aside>

        {/* Main content area */}
        <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
          {/* Mobile/tablet header */}
        <header
          className="sticky top-0 z-30 bg-white/80 dark:bg-warm-800/80
            backdrop-blur-lg border-b border-warm-100 dark:border-warm-700
            transition-colors duration-300 lg:hidden"
          role="banner"
        >
          <div className="mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
            {/* Left side: App Launcher + Branding Lockup */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button
                onClick={() => setIsLauncherOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-650 dark:text-warm-300 transition-colors shrink-0"
                title="App Launcher"
              >
                <LayoutGrid size={22} className="hidden sm:block" />
                <LayoutGrid size={20} className="sm:hidden" />
              </button>
              
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 cursor-pointer" onClick={() => navigate('/feed')}>
                <Logo variant="icon-only" size={30} className="hidden sm:block shrink-0" />
                <Logo variant="icon-only" size={26} className="sm:hidden shrink-0" />
                <h1
                  className="font-serif font-bold tracking-[0.08em] leading-none
                    bg-gradient-to-r from-primary-500 to-accent-500
                    bg-clip-text text-transparent
                    text-xl sm:text-2xl
                    hidden min-[360px]:block shrink-0"
                  style={{ paddingTop: '2px' }}
                >
                  WHISPRR
                </h1>
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 rounded-xl hover:bg-warm-100
                  dark:hover:bg-warm-700 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell size={20} className="text-warm-600 dark:text-warm-300" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 flex items-center justify-center
                      w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full"
                    aria-hidden="true"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile/Tablet Profile Menu */}
              {profile && (
                <div className="flex items-center">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center justify-center p-1 rounded-full border border-warm-200 dark:border-warm-700 hover:scale-105 active:scale-95 transition-all focus:outline-none"
                    aria-label="Profile menu"
                  >
                    <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="xs" />
                  </button>

                  {/* Hamburger Menu Trigger */}
                  <button
                    onClick={() => setIsLauncherOpen(true)}
                    className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 text-warm-650 dark:text-warm-300 transition-colors"
                    title="More Menu"
                  >
                    <Menu size={18} />
                  </button>

                  {/* Dropdown Menu Backdrop */}
                  {isMenuOpen && (
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setIsMenuOpen(false)}
                    />
                  )}

                  {/* Dropdown Menu Container */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-3xl shadow-float py-3 px-2 z-50 animate-scale-in flex flex-col space-y-0.5">
                      <div className="px-3 py-2 border-b border-warm-100 dark:border-warm-700 mb-2 flex items-center gap-2">
                         <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="sm" />
                         <div className="min-w-0">
                           <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm truncate">{profile.display_name}</p>
                           <p className="text-xs text-warm-500 truncate">@{profile.username}</p>
                         </div>
                      </div>

                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/profile'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/profile?edit=true'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/settings#privacy-heading'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        Privacy
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/settings#appearance-heading'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        Appearance
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/feedback'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        Feedback
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/building'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        Building WHISPRR
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/about'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        About Project
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/settings#trust-heading'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                      >
                        Help & Support
                      </button>
                      
                      <div className="border-t border-warm-100 dark:border-warm-700 my-1 pt-1" />
                      
                      {profile.role === 'founder' && (
                        <button
                          onClick={() => { setIsMenuOpen(false); navigate('/founder'); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors"
                        >
                          👑 Founder Panel
                        </button>
                      )}
                      <button
                        onClick={async () => { setIsMenuOpen(false); await signOut(); navigate('/auth'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Desktop header */}
        <header
          className="hidden lg:block sticky top-0 z-30 bg-white/80 dark:bg-warm-800/80
            backdrop-blur-lg border-b border-warm-100 dark:border-warm-700"
          role="banner"
        >
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-end">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl hover:bg-warm-100
                dark:hover:bg-warm-700 transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell size={20} className="text-warm-600 dark:text-warm-300" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 flex items-center justify-center
                    w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full"
                  aria-hidden="true"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full">
          {children || <Outlet />}
        </main>
      </div>
    </div>
      
      {/* Mobile bottom nav (hidden on desktop) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      <AppLauncherModal 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
      />
      <ChimeraPromoModal isOpen={isChimeraPromoOpen} onClose={() => setIsChimeraPromoOpen(false)} />
    </div>
  );
}
