import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Notification } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  unreadMessageCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!notifData || notifData.length === 0) {
      setNotifications([]);
      return;
    }

    const actorIds = [...new Set(notifData.map(n => n.actor_id).filter(Boolean))];
    let profileMap: Record<string, any> = {};

    if (actorIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', actorIds);

      profileData?.forEach(p => {
        profileMap[p.user_id] = p;
      });
    }

    const enriched = notifData.map(n => ({
      ...n,
      actor_profile: n.actor_id ? profileMap[n.actor_id] ?? null : null,
    }));

    setNotifications(enriched as Notification[]);
  }, [user]);

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return;

    try {
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!participantData || participantData.length === 0) {
        setUnreadMessageCount(0);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('read', false)
        .is('deleted_at', null);

      setUnreadMessageCount(count || 0);
    } catch {
      setUnreadMessageCount(0);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadMessages()]);
  }, [fetchNotifications, fetchUnreadMessages]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadMessages();
  }, [fetchNotifications, fetchUnreadMessages]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { fetchNotifications(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { fetchUnreadMessages(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => { fetchUnreadMessages(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications, fetchUnreadMessages]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, unreadMessageCount, markAsRead, markAllRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
