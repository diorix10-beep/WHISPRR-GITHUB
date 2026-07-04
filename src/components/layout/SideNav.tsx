import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Compass, Users, MessageCircle, Bell, ShieldAlert, Sparkles,
  User, Settings, Palette, Shield, HelpCircle, LogOut, ChevronUp
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../common/Avatar';
import { Logo } from '../common/Logo';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/communities', icon: Users, label: 'Communities' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/ai-family', icon: Sparkles, label: 'AI Family' },
];

export function SideNav() {
  const navigate = useNavigate();
  const { unreadCount, unreadMessageCount } = useNotifications();
  const { profile, signOut } = useAuth();
  const { toggleTheme } = useTheme();

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleNavItems = [...navItems];
  if (profile?.role === 'founder') {
    visibleNavItems.push({ path: '/founder', icon: ShieldAlert, label: 'Founder Panel' });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
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

      {/* User card at bottom with popup menu */}
      {profile && (
        <div className="px-3 py-4 border-t border-warm-100 dark:border-warm-700 relative" ref={menuRef}>
          {/* Dropdown Popover Menu */}
          {showMenu && (
            <div 
              className="absolute bottom-16 left-3 right-3 bg-white dark:bg-warm-850 
                border border-warm-100 dark:border-warm-700/80 rounded-2xl shadow-xl 
                p-2 space-y-0.5 z-50 animate-fade-in text-xs font-semibold"
            >
              <button
                onClick={() => { navigate('/profile'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <User size={15} className="text-primary-500" />
                <span>View Profile</span>
              </button>
              
              <button
                onClick={() => { navigate('/settings'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <Settings size={15} className="text-primary-500" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => { toggleTheme(); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <Palette size={15} className="text-primary-500" />
                <span>Appearance</span>
              </button>

              <button
                onClick={() => { navigate('/notifications'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <Bell size={15} className="text-primary-500" />
                <span>Notifications</span>
              </button>

              <button
                onClick={() => { navigate('/settings?tab=ai'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <Sparkles size={15} className="text-primary-500" />
                <span>AI Preferences</span>
              </button>

              <button
                onClick={() => { navigate('/settings?tab=privacy'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <Shield size={15} className="text-primary-500" />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => { navigate('/community-program'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <Users size={15} className="text-primary-500" />
                <span>Community Program</span>
              </button>

              <button
                onClick={() => { navigate('/settings?tab=about'); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-warm-700 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                <HelpCircle size={15} className="text-primary-500" />
                <span>Help & About</span>
              </button>

              <div className="border-t border-warm-100 dark:border-warm-700/80 my-1" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-700/80 transition-colors text-left"
          >
            <Avatar emoji={profile.avatar_emoji} photoUrl={profile.photo_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warm-900 dark:text-warm-50 truncate flex items-center justify-between">
                <span>{profile.display_name}</span>
                <ChevronUp size={14} className="text-warm-400 shrink-0 ml-1" />
              </p>
              <p className="text-xs text-warm-500 dark:text-warm-400 truncate">
                @{profile.username}
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
