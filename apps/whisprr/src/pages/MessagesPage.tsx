import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Plus, Search, X, Users, Loader2 } from 'lucide-react';
import type { Conversation, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { UserBadges } from '../components/common/UserBadges';

interface ConversationWithProfiles extends Conversation {
  conversation_participants: { user_id: string }[];
  other_user?: Profile;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Loading, Error and Keyboard navigation states
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (showNewMessageModal) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setFocusedIndex(-1);
      setConversationError(null);
    }
  }, [showNewMessageModal]);

  // Reset focus index when search results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchResults]);

  // Fetch conversations
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

      const whisprrConversations = conversationsWithProfiles.filter(c => c.other_user?.role !== 'ai_character');
      setConversations(whisprrConversations);
      fetchUnreadCounts(whisprrConversations.map(c => c.id));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread message counts
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

    // Subscribe to conversation updates
    const channel = supabase
      .channel('conversations-channel')
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

  // Search for users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  // Start new conversation
  const handleStartConversation = async (selectedUser: Profile) => {
    if (!user) return;

    setIsCreatingConversation(true);
    setConversationError(null);

    try {
      // 1. Fetch current user's conversations
      const { data: myConvs, error: myConvsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myConvsError) throw myConvsError;

      const myIds = (myConvs || []).map(c => c.conversation_id);
      if (myIds.length > 0) {
        // 2. See if the target user shares any DM with current user
        const { data: match, error: matchError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations(type)')
          .in('conversation_id', myIds)
          .eq('user_id', selectedUser.user_id);

        if (matchError) throw matchError;

        const existing = match?.find((m: any) => m.conversations?.type === 'dm');
        if (existing) {
          setShowNewMessageModal(false);
          setSearchQuery('');
          setSearchResults([]);
          navigate(`/messages/${existing.conversation_id}`);
          return;
        }
      }

      // 3. Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'dm',
          created_by: user.id,
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;

      if (!newConv) {
        throw new Error('Failed to create a conversation record.');
      }

      // 4. Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: selectedUser.user_id },
        ]);

      if (partError) throw partError;

      setShowNewMessageModal(false);
      setSearchQuery('');
      setSearchResults([]);
      navigate(`/messages/${newConv.id}`);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      setConversationError(error.message || 'Could not start conversation. Please try again.');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowNewMessageModal(false);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        handleStartConversation(searchResults[focusedIndex]);
      } else if (searchResults.length > 0) {
        handleStartConversation(searchResults[0]);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-warm-600">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header with New Message and Group Chat Buttons */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Messages</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="btn-primary flex items-center gap-2 py-2 px-4"
          >
            <Plus size={18} />
            New Message
          </button>
        </div>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle size={48} className="text-warm-300 mb-4" />
          <p className="text-warm-600 mb-2">No conversations yet</p>
          <p className="text-sm text-warm-500">
            Start a new conversation with a friend
          </p>
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="btn-primary mt-4 py-2 px-6"
          >
            New Message
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map(conv => {
            const unreadCount = unreadCounts[conv.id] || 0;
            const otherUser = conv.type === 'dm' ? conv.other_user : null;
            const isGroup = conv.type === 'group';

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="card w-full text-left hover:shadow-warm transition-all duration-200 flex items-center gap-3"
              >
                {/* Avatar */}
                {isGroup ? (
                  <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
                ) : otherUser ? (
                  <Avatar
                    photoUrl={otherUser.photo_url}
                    size="md"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-warm-200 dark:bg-warm-700 flex-shrink-0" />
                )}

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium text-warm-900 dark:text-warm-100 truncate flex items-center">
                      {isGroup ? ((conv as any).name || 'Group Chat') : (otherUser?.display_name || 'Unknown User')}
                      {!isGroup && otherUser && <UserBadges badges={otherUser.badges} role={otherUser.role} size="sm" />}
                    </h3>
                    {conv.last_message_at && (
                      <span className="text-xs text-warm-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(conv.last_message_at), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-warm-600 dark:text-warm-400 truncate">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>

                {/* Unread Indicator */}
                {unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <div className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-warm-800 border-b border-warm-200 dark:border-warm-700 p-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-100">
                New Message
              </h2>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                disabled={isCreatingConversation}
                className="btn-ghost p-2 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto relative">
              {/* Error Box */}
              {conversationError && (
                <div className="bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 p-3 rounded-2xl text-sm flex flex-col gap-2">
                  <p>{conversationError}</p>
                  <button 
                    onClick={() => {
                      if (focusedIndex >= 0 && searchResults[focusedIndex]) {
                        handleStartConversation(searchResults[focusedIndex]);
                      }
                    }}
                    className="btn-primary self-start text-xs py-1 px-3"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-warm-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by username or name..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isCreatingConversation}
                  className="input-field pl-10 disabled:opacity-60"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length > 0 && (
                <div className="space-y-2">
                  {searching ? (
                    <div className="text-center py-4 text-warm-500">
                      Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-4 text-warm-500">
                      No users found
                    </div>
                  ) : (
                    searchResults.map((user, index) => {
                      const isFocused = index === focusedIndex;
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleStartConversation(user)}
                          disabled={isCreatingConversation}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-150 text-left outline-none ${
                            isFocused 
                              ? 'bg-primary-50 dark:bg-primary-950/40 ring-2 ring-primary-500 dark:ring-primary-400 scale-[1.01]' 
                              : 'hover:bg-warm-100 dark:hover:bg-warm-700 active:scale-[0.99] active:bg-warm-200 dark:active:bg-warm-600'
                          }`}
                        >
                          <Avatar
                            photoUrl={user.photo_url}
                            size="md"
                          />
                          <div className="text-left">
                            <p className="font-semibold text-warm-900 dark:text-warm-100">
                              {user.display_name}
                            </p>
                            <p className="text-sm text-warm-600 dark:text-warm-400">
                              @{user.username}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {searchQuery.length === 0 && (
                <div className="text-center py-8 text-warm-500">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Search for a user to start a conversation</p>
                </div>
              )}

              {/* Loading State Overlay */}
              {isCreatingConversation && (
                <div className="absolute inset-0 bg-white/70 dark:bg-warm-800/70 flex flex-col items-center justify-center z-10">
                  <Loader2 size={36} className="text-primary-500 animate-spin mb-2" />
                  <p className="text-sm font-semibold text-warm-700 dark:text-warm-300">Opening chat...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
