import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Compass, Users, MessageCircle, Bell, Menu, Plus, BookOpen, User 
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';

export function BottomNav() {
  const { unreadCount, unreadMessageCount } = useNotifications();
  const location = useLocation();

  const nexaItems = [
    { path: '/', icon: Compass, label: 'Explore' },
    { path: '/chats', icon: MessageCircle, label: 'Chats', badge: true },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/personas', icon: User, label: 'Personas' },
  ];

  const items = nexaItems;

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-app-launcher'));
  };

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
        {items.map((item) => {
          const { path, icon: Icon, label } = item;
          const isAction = 'isAction' in item && item.isAction;
          const isMessages = label === 'Messages' || label === 'Chats';
          const isNotifications = label === 'Notifications';
          const badgeCount = isMessages ? unreadMessageCount : isNotifications ? unreadCount : 0;

          if (isAction) {
            return (
              <button
                key={label}
                onClick={handleActionClick}
                className="flex flex-col items-center justify-center py-3 px-2 relative
                  transition-all duration-200 flex-1 text-warm-400 dark:text-warm-500 hover:text-primary-400
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
                aria-label="Open launcher more menu"
              >
                <Icon size={22} strokeWidth={1.8} />
                <span className="text-[10px] mt-0.5 font-medium">{label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/' || path === '/nexa'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 px-2 relative
                transition-all duration-200 flex-1
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg
                ${
                  isActive
                    ? isNexa ? 'text-red-500' : 'text-primary-500'
                    : 'text-warm-400 dark:text-warm-500 hover:text-primary-400'
                }`
              }
              aria-label={badgeCount > 0 ? `${label}, ${badgeCount} unread` : label}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={1.8} className="transition-colors duration-200" />
                {badgeCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 flex items-center justify-center
                      w-4 h-4 text-white text-[10px] font-bold rounded-full ${isNexa ? 'bg-red-500' : 'bg-primary-500'}`}
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

