import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface UnreadMessagesContextType {
  unreadMessagesCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!user) return;

    // Fetch conversation IDs where the user is a participant
    const { data: participationData, error: participationError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (participationError || !participationData || participationData.length === 0) {
      setUnreadMessagesCount(0);
      return;
    }

    const conversationIds = participationData.map(p => p.conversation_id);

    // Count unread messages in those conversations that are not sent by the user
    const { count, error: messageError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('read', false)
      .neq('sender_id', user.id); // Direct messages not sent by user

    if (messageError) {
      console.error('Error fetching unread messages count:', messageError);
      return;
    }

    setUnreadMessagesCount(count || 0);
  }, [user]);

  useEffect(() => {
    fetchUnreadMessagesCount();
  }, [fetchUnreadMessagesCount]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' }, // Subscribe to new messages
        () => { fetchUnreadMessagesCount(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `read=eq.true` }, // Subscribe to messages being read
        () => { fetchUnreadMessagesCount(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUnreadMessagesCount]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadMessagesCount, refreshUnreadCount: fetchUnreadMessagesCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
}
