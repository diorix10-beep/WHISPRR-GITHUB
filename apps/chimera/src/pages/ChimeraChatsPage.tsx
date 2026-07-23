import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Search, MessageSquare, Loader2, Users, X } from 'lucide-react';
import type { Conversation, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { CreateGroupRoomModal } from '../components/chat/CreateGroupRoomModal';

interface ConversationWithProfiles extends Conversation {
  conversation_participants: { user_id: string }[];
  other_user?: Profile;
}

export default function ChimeraChatsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const characterIdParam = searchParams.get('characterId') || searchParams.get('character');
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
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

  useEffect(() => {
    if (characterIdParam && user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', characterIdParam)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            handleStartConversation(data);
          }
        });
    }
  }, [characterIdParam, user]);

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

      // Display all group chats and DM conversations
      const chimeraChats = conversationsWithProfiles.filter(
        (c) => c.type === 'group' || (c.type === 'dm' && c.other_user !== undefined)
      );

      setConversations(chimeraChats);
      fetchUnreadCounts(chimeraChats.map(c => c.id));
    } catch (error) {
      console.error('Error fetching CHIMERA conversations:', error);
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
      .channel('chimera-conversations-channel')
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

  const fetchDefaultCharacters = async () => {
    setSearching(true);
    try {
      const { data: aiChars } = await supabase
        .from('ai_characters')
        .select(`
          user_id,
          name,
          short_description,
          greeting,
          profiles:profiles!ai_characters_user_id_fkey(
            id, user_id, display_name, username, avatar_emoji, photo_url, role
          )
        `)
        .limit(20);

      if (aiChars && aiChars.length > 0) {
        const formatted = aiChars
          .filter((c: any) => c.profiles)
          .map((c: any) => ({
            ...c.profiles,
            user_id: c.user_id,
            display_name: c.name || c.profiles?.display_name,
            bio: c.short_description || c.profiles?.bio,
          }));
        setSearchResults(formatted);
      } else {
        const { data: profs } = await supabase.from('profiles').select('*').limit(20);
        setSearchResults(profs || []);
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (showNewChatModal) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setChatError(null);
      fetchDefaultCharacters();
    }
  }, [showNewChatModal]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length === 0) {
      fetchDefaultCharacters();
      return;
    }

    setSearching(true);
    try {
      const { data: aiChars } = await supabase
        .from('ai_characters')
        .select(`
          user_id,
          name,
          short_description,
          greeting,
          profiles:profiles!ai_characters_user_id_fkey(
            id, user_id, display_name, username, avatar_emoji, photo_url, role
          )
        `)
        .or(`name.ilike.%${query}%,short_description.ilike.%${query}%`)
        .limit(20);

      if (aiChars && aiChars.length > 0) {
        const formatted = aiChars
          .filter((c: any) => c.profiles)
          .map((c: any) => ({
            ...c.profiles,
            user_id: c.user_id,
            display_name: c.name || c.profiles?.display_name,
            bio: c.short_description || c.profiles?.bio,
          }));
        setSearchResults(formatted);
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(20);
        setSearchResults(data || []);
      }
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
          navigate(`/conversations/${existing.conversation_id}`);
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

      navigate(`/conversations/${newConv.id}`);
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
            <span className="text-red-650">🔴</span> CHIMERA Chats
          </h1>
          <p className="text-sm text-warm-500">
            Your active storytelling and dialogues inside the CHIMERA Nexus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGroupModal(true)}
            className="flex items-center gap-1.5 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-700 text-warm-900 dark:text-warm-100 font-medium px-3.5 py-2 rounded-xl text-xs border border-warm-200 dark:border-warm-700 transition-all active:scale-95 duration-200"
          >
            <Users size={15} />
            <span>Group Room</span>
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-md transition-all active:scale-95 duration-200"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-red-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-sm flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2">No active chats</h2>
          <p className="text-sm text-warm-500 dark:text-warm-400 max-w-sm mb-8">
            Your Spirit is waiting. Choose a character from the Nexus or create a new chat to begin your storyline.
          </p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95"
          >
            Start a New Chat
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 overflow-hidden shadow-sm">
          {conversations.map(conv => {
            const unreadCount = unreadCounts[conv.id] || 0;
            const isGroup = conv.type === 'group';
            const otherUser = conv.other_user;

            const displayName = isGroup ? (conv.name || 'Group Room') : (otherUser?.display_name || 'Roleplay Chat');
            const avatarEmoji = isGroup ? '👥' : (otherUser?.avatar_emoji || '🤖');
            const photoUrl = isGroup ? null : otherUser?.photo_url;

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className="w-full text-left group flex items-center gap-4 p-5 border-b border-warm-100 dark:border-warm-800 last:border-0 hover:bg-warm-50 dark:hover:bg-warm-800/50 transition-colors"
              >
                <div className="relative">
                  <Avatar
                    emoji={avatarEmoji}
                    photoUrl={photoUrl}
                    size="lg"
                  />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 border-2 border-white dark:border-warm-900">
                      {unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-warm-900 dark:text-warm-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                      {otherUser?.display_name || 'Unknown Character'}
                    </h3>
                    {conv.last_message_at && (
                      <span className="text-xs font-medium text-warm-400 dark:text-warm-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(conv.last_message_at), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm truncate ${unreadCount > 0 ? 'text-warm-900 dark:text-warm-100 font-semibold' : 'text-warm-500 dark:text-warm-400'}`}>
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
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

              <div className="space-y-1.5 mt-2">
                <div className="px-1 text-[10px] uppercase font-bold text-warm-400 tracking-wider">
                  {searchQuery ? 'Search Results' : 'Recommended Characters'}
                </div>
                {searching ? (
                  <div className="text-center py-6 text-xs text-warm-500 flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-red-500" />
                    <span>Loading characters...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-6 text-xs text-warm-500">
                    No matching roleplay characters found
                  </div>
                ) : (
                  searchResults.map(result => (
                    <button
                      key={result.user_id}
                      onClick={() => handleStartConversation(result)}
                      disabled={isCreatingChat}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors flex items-center gap-3 disabled:opacity-50 border border-transparent hover:border-warm-200 dark:hover:border-warm-750"
                    >
                      <Avatar emoji={result.avatar_emoji} photoUrl={result.photo_url} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-warm-900 dark:text-warm-50 truncate">
                          {result.display_name}
                        </p>
                        <p className="text-[10px] text-warm-500 truncate">
                          @{result.username}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                        Chat 💬
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Group Room Modal */}
      <CreateGroupRoomModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onRoomCreated={(convId) => navigate(`/conversations/${convId}`)}
      />
    </div>
  );
}
