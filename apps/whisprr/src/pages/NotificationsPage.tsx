import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck } from 'lucide-react';
import type { Notification } from '../types';
import { useNotifications } from '../contexts/NotificationsContext';
import { Avatar } from '../components/common/Avatar';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const getNotificationText = (notification: Notification): string => {
    const actorProfile = notification.actor_profile;
    const actorName = actorProfile?.display_name || 'Someone';

    switch (notification.type) {
      case 'follow':
        return `${actorName} followed you`;
      case 'reaction':
        return `${actorName} felt your whisper`;
      case 'comment':
        return `${actorName} commented on your whisper`;
      case 'mention':
        return `${actorName} mentioned you`;
      case 'message':
        return `${actorName} sent you a message`;
      default:
        return 'New notification';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicking
    if (!notification.read) {
      markAsRead(notification.id);
    }

    const actorProfile = notification.actor_profile;

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        if (actorProfile?.username) {
          navigate(`/profile/${actorProfile.username}`);
        }
        break;
      case 'reaction':
      case 'comment':
        if (notification.reference_id) {
          navigate(`/whisper/${notification.reference_id}`);
        }
        break;
      case 'mention':
        if (notification.reference_id) {
          navigate(`/whisper/${notification.reference_id}`);
        }
        break;
      case 'message':
        if (notification.reference_id) {
          navigate(`/messages/${notification.reference_id}`);
        }
        break;
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    const dateKey = date.toLocaleDateString();

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors text-sm font-medium"
            title="Mark all as read"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <div className="mb-4 p-3 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-2xl text-sm font-medium">
          You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-2">
            No notifications yet
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            When people interact with you, you'll see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              {/* Date Separator */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-warm-200 dark:bg-warm-700" />
                <span className="text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase">
                  {dateKey}
                </span>
                <div className="flex-1 h-px bg-warm-200 dark:bg-warm-700" />
              </div>

              {/* Notifications for this date */}
              <div className="space-y-2">
                {groupedNotifications[dateKey].map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 rounded-2xl transition-all duration-200 text-left ${
                      notification.read
                        ? 'bg-warm-50 dark:bg-warm-800 hover:bg-warm-100 dark:hover:bg-warm-750'
                        : 'bg-primary-50 dark:bg-primary-900 hover:bg-primary-100 dark:hover:bg-primary-850 border-l-4 border-primary-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {notification.actor_profile && (
                        <Avatar
                          emoji={notification.actor_profile.avatar_emoji}
                          photoUrl={notification.actor_profile.photo_url}
                          size="md"
                        />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold text-warm-900 dark:text-warm-50">
                            {getNotificationText(notification)}
                          </p>

                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </div>

                        <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
