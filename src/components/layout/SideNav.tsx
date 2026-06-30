import { NavLink } from 'react-router-dom';
import { Home, Compass, Users, MessageCircle, User, Settings, Bell, ShieldAlert, Sparkles } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import { UserBadges } from '../common/UserBadges';
import { Logo } from '../common/Logo';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/communities', icon: Users, label: 'Communities' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/ai-family', icon: Sparkles, label: 'AI Family' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function SideNav() {
  const { unreadCount, unreadMessageCount } = useNotifications();
  const { profile } = useAuth();

  const visibleNavItems = [...navItems];
  if (profile?.role === 'founder') {
    visibleNavItems.push({ path: '/founder', icon: ShieldAlert, label: 'Founder Panel' });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-warm-100 dark:border-warm-700 flex items-center gap-3">
        <Logo size={36} />
        <div>
          <h1
            className="font-serif text-2xl font-bold
              bg-gradient-to-r from-primary-500 to-accent-500
              bg-clip-text text-transparent tracking-wide"
          >
            WHISPRR
          </h1>
          <p className="text-xs text-warm-500 dark:text-warm-400">
            Where connections feel real
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {visibleNavItems.map(({ path, icon: Icon, label }) => {
          const isMessages = label === 'Messages';
          const isNotifications = label === 'Notifications';
          const badgeCount = isMessages ? unreadMessageCount : isNotifications ? unreadCount : 0;

          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/' || path === '/profile'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-700 hover:text-warm-900 dark:hover:text-warm-100'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} strokeWidth={1.8} />
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center
                      w-3.5 h-3.5 bg-primary-500 text-white text-[8px] font-bold rounded-full"
                    aria-hidden="true"
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
              {badgeCount > 0 && (
                <span className="ml-auto bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User card at bottom */}
      {profile && (
        <div className="px-3 py-4 border-t border-warm-100 dark:border-warm-700">
          <NavLink
            to="/profile"
            end
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
          >
            <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warm-900 dark:text-warm-50 truncate flex items-center">
                {profile.display_name}
                <UserBadges badges={profile.badges} role={profile.role} size="sm" />
              </p>
              <p className="text-xs text-warm-500 dark:text-warm-400 truncate">
                @{profile.username}
              </p>
            </div>
          </NavLink>
        </div>
      )}
    </div>
  );
}
