import { NavLink } from 'react-router-dom';
import { Home, Compass, Users, MessageCircle, Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/communities', icon: Users, label: 'Communities' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
];

export function BottomNav() {
  const { unreadCount, unreadMessageCount } = useNotifications();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto
        bg-white dark:bg-warm-800
        border-t border-warm-200 dark:border-warm-700
        rounded-t-3xl shadow-soft z-40
        safe-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isMessages = label === 'Messages';
          const isNotifications = label === 'Notifications';
          const badgeCount = isMessages ? unreadMessageCount : isNotifications ? unreadCount : 0;

          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 px-2 relative
                transition-all duration-200 flex-1
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg
                ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-warm-400 dark:text-warm-500 hover:text-primary-400'
                }`
              }
              aria-label={badgeCount > 0 ? `${label}, ${badgeCount} unread` : label}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={1.8} className="transition-colors duration-200" />
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center
                      w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full"
                    aria-hidden="true"
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
