import { type ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { useNotifications } from '../../contexts/NotificationsContext';
import { Logo } from '../common/Logo';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 transition-colors duration-300">
      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-warm-200 lg:dark:border-warm-700 lg:bg-white lg:dark:bg-warm-800 z-30">
        <SideNav />
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile/tablet header */}
        <header
          className="sticky top-0 z-30 bg-white/80 dark:bg-warm-800/80
            backdrop-blur-lg border-b border-warm-100 dark:border-warm-700
            transition-colors duration-300 lg:hidden"
          role="banner"
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <h1
                className="font-serif text-2xl font-bold
                  bg-gradient-to-r from-primary-500 to-accent-500
                  bg-clip-text text-transparent tracking-wide"
              >
                WHISPRR
              </h1>
            </div>
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

      {/* Mobile bottom nav (hidden on desktop) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
