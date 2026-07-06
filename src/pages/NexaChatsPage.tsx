import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus, Search, X, Loader2 } from 'lucide-react';
import type { Conversation, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';

interface ConversationWithProfiles extends Conversation {
  conversation_participants: { user_id: string }[];
  other_user?: Profile;
}

export default function NexaChatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewChatModal) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setChatError(null);
    }
  }, [showNewChatModal]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, conversation_participants(*)')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Filter to only conversations where current user is a participant
      const userConversations = (data || []).filter((conv: any) =>
        (conv.conversation_participants || []).some((p: any) => p.user_id === user.id)
      );

      // Fetch other user profiles for DMs
      const conversationsWithProfiles = await Promise.all(
        userConversations.map(async (conv: any) => {
          if (conv.type === 'dm') {
            const otherUserId = (conv.conversation_participants || [])
              .find((p: any) => p.user_id !== user.id)?.user_id;

            if (otherUserId) {
              const { data: otherUserProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', otherUserId)
                .maybeSingle();

              return {
                ...conv,
                other_user: otherUserProfile || undefined,
              } as ConversationWithProfiles;
            }
          }
          return conv as ConversationWithProfiles;
        })
      );

      // Only display chats with AI Characters (role: 'ai_character')
      // Exclude Oracle Family members based on their seeded UUIDs
      const ORACLE_FAMILY_IDS = [
        'da01a00a-60d7-41ec-b827-8178cd3bf084', // Oracle
        'da01a00b-60d7-41ec-b827-8178cd3bf084', // Iris
        'da01a00c-60d7-41ec-b827-8178cd3bf084', // Atlas
        'da01a00d-60d7-41ec-b827-8178cd3bf084', // Athena
        'da01a00e-60d7-41ec-b827-8178cd3bf084', // Aegis
        'da01a00f-60d7-41ec-b827-8178cd3bf084'  // Whisprr
      ];

      const nexaChats = conversationsWithProfiles.filter(
        (c) => c.other_user?.role === 'ai_character' && !ORACLE_FAMILY_IDS.includes(c.other_user.user_id)
      );

      setConversations(nexaChats);
      fetchUnreadCounts(nexaChats.map(c => c.id));
    } catch (error) {
      console.error('Error fetching NEXA conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async (conversationIds: string[]) => {
    if (!user || conversationIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', user.id);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach(msg => {
        counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  useEffect(() => {
    fetchConversations();

    if (!user) return;

    const channel = supabase
      .channel('nexa-conversations-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Find public AI Characters to chat with (excluding Oracle Family)
      const ORACLE_FAMILY_IDS = [
        'da01a00a-60d7-41ec-b827-8178cd3bf084',
        'da01a00b-60d7-41ec-b827-8178cd3bf084',
        'da01a00c-60d7-41ec-b827-8178cd3bf084',
        'da01a00d-60d7-41ec-b827-8178cd3bf084',
        'da01a00e-60d7-41ec-b827-8178cd3bf084',
        'da01a00f-60d7-41ec-b827-8178cd3bf084'
      ];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ai_character')
        .not('user_id', 'in', `(${ORACLE_FAMILY_IDS.join(',')})`)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching roleplay characters:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleStartConversation = async (selectedBot: Profile) => {
    if (!user) return;

    setIsCreatingChat(true);
    setChatError(null);

    try {
      // Fetch user's existing conversation participants
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      const myIds = (myConvs || []).map(c => c.conversation_id);
      if (myIds.length > 0) {
        // Check if there is an existing DM with this bot
        const { data: match } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations(type)')
          .in('conversation_id', myIds)
          .eq('user_id', selectedBot.user_id);

        const existing = match?.find((m: any) => m.conversations?.type === 'dm');
        if (existing) {
          navigate(`/messages/${existing.conversation_id}`);
          return;
        }
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'dm',
          created_by: user.id,
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;
      if (!newConv) throw new Error('Failed to create conversation record.');

      // Add participants
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: selectedBot.user_id },
        ]);

      // Seed greeting
      const { data: charDetails } = await supabase
        .from('ai_characters')
        .select('greeting')
        .eq('user_id', selectedBot.user_id)
        .maybeSingle();

      const greetingContent = charDetails?.greeting || "Hello! Let's start our roleplay.";

      await supabase.from('messages').insert({
        conversation_id: newConv.id,
        sender_id: selectedBot.user_id,
        content: greetingContent,
        read: false
      });

      await supabase
        .from('conversations')
        .update({
          last_message: greetingContent,
          last_message_at: new Date().toISOString()
        })
        .eq('id', newConv.id);

      navigate(`/messages/${newConv.id}`);
    } catch (error: any) {
      console.error('Error starting roleplay chat:', error);
      setChatError(error.message || 'Could not establish connection.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
            <span className="text-red-650">🔴</span> NEXA Chats
          </h1>
          <p className="text-sm text-warm-500">
            Your active storytelling and dialogues inside the NEXA Nexus
          </p>
        </div>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-md transition-all active:scale-95 duration-200"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-red-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center border-red-500/10 dark:border-red-950/20 bg-warm-950/10">
          <MessageSquare size={48} className="text-warm-300 dark:text-warm-700 mb-4" />
          <p className="text-warm-700 dark:text-warm-300 font-semibold mb-2">No active chats in the Nexus yet</p>
          <p className="text-xs text-warm-500 max-w-xs">
            Browse the Nexus to choose a persona and start an interactive story.
          </p>
          <button
            onClick={() => navigate('/nexa')}
            className="mt-6 bg-red-650 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-sm transition-all"
          >
            Explore Nexus
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map(conv => {
            const unreadCount = unreadCounts[conv.id] || 0;
            const otherUser = conv.other_user;

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="card w-full text-left hover:shadow-md transition-all duration-200 flex items-center gap-3 border border-warm-200 dark:border-warm-800 hover:border-red-500/20 dark:hover:border-red-500/10"
              >
                {otherUser ? (
                  <Avatar
                    emoji={otherUser.avatar_emoji}
                    photoUrl={otherUser.photo_url}
                    size="md"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-warm-200 dark:bg-warm-700 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-warm-900 dark:text-warm-100 truncate">
                      {otherUser?.display_name || 'Unknown Character'}
                    </h3>
                    {conv.last_message_at && (
                      <span className="text-[10px] text-warm-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(conv.last_message_at), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-warm-500 truncate">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <div className="bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-xs">
          <div className="bg-white dark:bg-warm-850 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col border border-warm-200 dark:border-warm-800 shadow-2xl">
            <div className="bg-white dark:bg-warm-850 border-b border-warm-150 dark:border-warm-800 p-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-100">
                Start Roleplay Chat
              </h2>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                disabled={isCreatingChat}
                className="p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {chatError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 rounded-xl text-xs">
                  {chatError}
                </div>
              )}

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-warm-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search characters by name..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  disabled={isCreatingChat}
                  className="w-full bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-750 focus:border-red-500 rounded-xl py-2 pl-9 pr-4 text-xs outline-none transition-colors"
                />
              </div>

              {searchQuery.length > 0 && (
                <div className="space-y-1.5">
                  {searching ? (
                    <div className="text-center py-4 text-xs text-warm-500">
                      Searching active personas...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-4 text-xs text-warm-500">
                      No matching roleplay characters found
                    </div>
                  ) : (
                    searchResults.map(result => (
                      <button
                        key={result.user_id}
                        onClick={() => handleStartConversation(result)}
                        disabled={isCreatingChat}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors flex items-center gap-3 disabled:opacity-50"
                      >
                        <Avatar emoji={result.avatar_emoji} photoUrl={result.photo_url} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-warm-900 dark:text-warm-100 truncate">
                            {result.display_name}
                          </p>
                          <p className="text-[10px] text-warm-500 truncate">
                            @{result.username}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
