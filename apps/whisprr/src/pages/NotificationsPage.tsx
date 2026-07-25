import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, CheckCheck, Heart, MessageCircle, AtSign, Mail, 
  UserPlus, Sparkles
} from 'lucide-react';
import type { Notification } from '../types';
import { useNotifications } from '../contexts/NotificationsContext';
import { Avatar } from '../components/common/Avatar';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'follow':    return { Icon: UserPlus, color: 'bg-primary-100 dark:bg-primary-500/15 text-primary-500' };
    case 'reaction':  return { Icon: Heart, color: 'bg-rose-100 dark:bg-rose-500/15 text-rose-500' };
    case 'comment':   return { Icon: MessageCircle, color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-500' };
    case 'mention':   return { Icon: AtSign, color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-500' };
    case 'message':   return { Icon: Mail, color: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-500' };
    default:          return { Icon: Bell, color: 'bg-warm-100 dark:bg-warm-800 text-warm-500' };
  }
}

function getNotificationText(notification: Notification): string {
  const name = notification.actor_profile?.display_name || 'Someone';
  switch (notification.type) {
    case 'follow':   return `${name} started following you`;
    case 'reaction': return `${name} felt your whisper`;
    case 'comment':  return `${name} commented on your whisper`;
    case 'mention':  return `${name} mentioned you`;
    case 'message':  return `${name} sent you a message`;
    default:         return 'New notification';
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    const actor = notification.actor_profile;
    switch (notification.type) {
      case 'follow':
        if (actor?.username) navigate(`/profile/${actor.username}`);
        break;
      case 'reaction':
      case 'comment':
      case 'mention':
        if (notification.reference_id) navigate(`/whisper/${notification.reference_id}`);
        break;
      case 'message':
        if (notification.reference_id) navigate(`/messages/${notification.reference_id}`);
        break;
    }
  };

  const groupedNotifications = notifications.reduce((acc, n) => {
    const key = new Date(n.created_at).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {} as Record<string, Notification[]>);

  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="content-shell content-shell-sm">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-extrabold text-warm-900 dark:text-white">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-black min-w-[22px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-750 transition-all text-xs font-bold border border-warm-200 dark:border-warm-700 active:scale-95"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* ── Unread banner ── */}
      {unreadCount > 0 && (
        <div className="mb-5 px-4 py-3 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-2xl flex items-center gap-2.5">
          <Sparkles size={15} className="text-primary-500 shrink-0" />
          <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </p>
        </div>
      )}

      {/* ── Empty State ── */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-750 flex items-center justify-center shadow-inner">
            <Bell size={36} className="text-warm-300 dark:text-warm-600" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h2 className="font-serif text-xl font-extrabold text-warm-900 dark:text-white">
              Nothing here yet
            </h2>
            <p className="text-sm text-warm-500 dark:text-warm-400 leading-relaxed font-medium">
              When people follow you, react to your whispers, or mention you — it'll appear here.
            </p>
          </div>
        </div>
      ) : (
        /* ── Grouped Notification List ── */
        <div className="space-y-6 animate-fade-in">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="space-y-1.5">
              
              {/* Date separator */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-warm-100 dark:bg-warm-800" />
                <span className="text-[10px] font-black uppercase tracking-widest text-warm-400 dark:text-warm-500 whitespace-nowrap">
                  {dateKey}
                </span>
                <div className="flex-1 h-px bg-warm-100 dark:bg-warm-800" />
              </div>

              {/* Notification items */}
              {groupedNotifications[dateKey].map((notification) => {
                const { Icon, color } = getNotificationIcon(notification.type);
                const isUnread = !notification.read;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className={`group w-full flex items-start gap-3.5 p-4 rounded-2xl text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      isUnread
                        ? 'bg-primary-50 dark:bg-primary-500/8 hover:bg-primary-100 dark:hover:bg-primary-500/15 border border-primary-100 dark:border-primary-500/20'
                        : 'bg-white dark:bg-warm-850 hover:bg-warm-50 dark:hover:bg-warm-800 border border-warm-100 dark:border-warm-800'
                    }`}
                  >
                    {/* Avatar + type icon */}
                    <div className="relative shrink-0">
                      {notification.actor_profile ? (
                        <Avatar photoUrl={notification.actor_profile.photo_url} size="md" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-warm-200 dark:bg-warm-700" />
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-warm-850 ${color}`}>
                        <Icon size={10} strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug font-semibold ${
                        isUnread ? 'text-warm-900 dark:text-white' : 'text-warm-700 dark:text-warm-300'
                      }`}>
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-warm-400 dark:text-warm-500 mt-0.5 font-medium">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
