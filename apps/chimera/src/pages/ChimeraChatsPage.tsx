import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Search, MessageSquare, Loader2, Users, X, Lock, BookOpen, ShieldCheck } from 'lucide-react';
import type { Conversation, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { CreateGroupRoomModal } from '../components/chat/CreateGroupRoomModal';

interface ConversationWithProfiles extends Conversation {
  conversation_participants: { user_id: string }[];
  other_user?: Profile;
}

interface PublicRoleplayScene {
  id: string;
  title: string;
  summary: string;
  content_rating: 'limited' | 'mature';
  published_at: string;
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
  const [chatShelf, setChatShelf] = useState<'private' | 'public'>('private');
  const [publicScenes, setPublicScenes] = useState<PublicRoleplayScene[]>([]);
  const [loadingPublicScenes, setLoadingPublicScenes] = useState(false);

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

      // Display only CHIMERA AI Character roleplay chats & group rooms (exclude human WHISPRR user DMs)
      const chimeraChats = conversationsWithProfiles.filter(
        (c) => c.type === 'group' || (c.type === 'dm' && c.other_user !== undefined && (c.other_user.role === 'ai_character' || (c as any).character_id))
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

  useEffect(() => {
    if (chatShelf !== 'public') return;
    const fetchPublicScenes = async () => {
      setLoadingPublicScenes(true);
      try {
        const { data, error } = await supabase
          .from('roleplay_public_scenes')
          .select('id, title, summary, content_rating, published_at')
          .eq('visibility', 'public')
          .order('published_at', { ascending: false });
        if (error) throw error;
        setPublicScenes((data || []) as PublicRoleplayScene[]);
      } catch (error) {
        console.error('Could not load public roleplay scenes:', error);
        setPublicScenes([]);
      } finally {
        setLoadingPublicScenes(false);
      }
    };
    fetchPublicScenes();
  }, [chatShelf]);

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
        .or(`visibility.eq.public,creator_id.eq.${user?.id}`)
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
        setSearchResults([]);
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
        .or(`visibility.eq.public,creator_id.eq.${user?.id}`)
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
        setSearchResults([]);
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
    <div className="rp-page">
    <div className="max-w-[1180px] mx-auto px-4 py-12 relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="rp-micro flex items-center gap-2"><MessageSquare size={14} /> Roleplay conversations</p>
          <h1 className="rp-heading mt-3 text-4xl sm:text-5xl font-bold flex items-center gap-2">
            Your rooms, your rules.
          </h1>
          <p className="rp-copy mt-3 max-w-xl text-sm leading-relaxed">
            Private conversations stay between you and the character. Share a scene only when you decide it belongs in the wider world.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGroupModal(true)}
            className="rp-outline-button px-4 py-3 text-xs"
          >
            <Users size={15} />
            <span>Group Room</span>
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="rp-gold-button px-4 py-3 text-sm"
          >
            <Plus size={16} />
            <span>Start a chat</span>
          </button>
        </div>
      </div>

      <div className="mb-7 inline-flex rounded-2xl border border-[#c99b50]/45 bg-black/35 p-1 shadow-sm">
        <button
          onClick={() => setChatShelf('private')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${chatShelf === 'private' ? 'bg-[#2b2116] text-[#ffe2a1] shadow-sm ring-1 ring-[#c99b50]/70' : 'text-[#bfb4a3] hover:text-[#f4d390]'}`}
        >
          <Lock size={14} /> Private
        </button>
        <button
          onClick={() => setChatShelf('public')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${chatShelf === 'public' ? 'bg-[#2b2116] text-[#ffe2a1] shadow-sm ring-1 ring-[#c99b50]/70' : 'text-[#bfb4a3] hover:text-[#f4d390]'}`}
        >
          <BookOpen size={14} /> Public
        </button>
      </div>

      {chatShelf === 'public' ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_0.48fr]">
          <div className="rp-panel rounded-3xl p-5 sm:p-6">
            {loadingPublicScenes ? (
              <div className="flex min-h-56 items-center justify-center"><Loader2 className="animate-spin text-red-500" size={28} /></div>
            ) : publicScenes.length === 0 ? (
              <div className="px-3 py-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#c99b50]/35 bg-[#c99b50]/10 text-[#e6c377]"><BookOpen size={28} /></div>
                <h2 className="rp-heading text-2xl font-bold">No public scenes yet</h2>
                <p className="rp-copy mx-auto mt-3 max-w-md text-sm leading-relaxed">A public scene will appear here only after someone deliberately shares a private roleplay. CHIMERA never makes a chat public by accident.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {publicScenes.map((scene) => (
                  <button key={scene.id} onClick={() => navigate(`/conversations/scenes/${scene.id}`)} className="rp-card w-full rounded-2xl p-4 text-left">
                    <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-lg font-bold text-[#fff3df]">{scene.title}</h2><span className="rounded-full border border-[#c99b50]/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#d9bd82]">{scene.content_rating}</span></div>
                    {scene.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#c9bda9]">{scene.summary}</p>}
                    <p className="mt-3 text-xs font-medium text-[#e6c377]">Read shared scene</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <aside className="rp-card rounded-3xl p-6">
            <ShieldCheck className="mb-4 text-amber-500" size={24} />
            <h2 className="rp-heading text-xl font-bold">When you decide to share</h2>
            <p className="rp-copy mt-3 text-sm leading-relaxed">Give the scene a title, choose its visibility and rating, then confirm before anyone else can read it.</p>
          </aside>
        </section>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-red-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rp-panel rounded-3xl flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in space-y-6">
          {/* Icon */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#c99b50]/35 bg-[#c99b50]/10 shadow-inner">
              <MessageSquare size={32} className="text-[#e6c377]" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#17120e] bg-gradient-to-br from-amber-400 to-orange-400 text-[11px]">
              ✨
            </div>
          </div>
          {/* Copy */}
          <div className="space-y-2 max-w-xs">
            <h2 className="rp-heading text-xl font-extrabold">
              Your story is waiting.
            </h2>
            <p className="rp-copy text-sm leading-relaxed font-medium">
              Begin privately with any character you choose. The room is yours before it is anyone else’s.
            </p>
          </div>
          {/* CTA */}
          <button
            onClick={() => setShowNewChatModal(true)}
            className="rp-gold-button"
          >
            <MessageSquare size={16} />
            Start Your First Chat
          </button>
          {/* Discovery nudge */}
          <p className="text-xs text-[#b9ad9c] font-medium">
            Or <button onClick={() => navigate('/discover')} className="text-[#e6c377] hover:text-[#fff0be] font-bold transition-colors underline-offset-2 hover:underline">find a doorway</button> on Discover
          </p>
        </div>
      ) : (
        <div className="rp-panel rounded-3xl overflow-hidden">
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
                className="group flex w-full items-center gap-4 border-b border-[#c99b50]/15 p-5 text-left last:border-0 transition-colors hover:bg-[#c99b50]/[0.06]"
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
                    <h3 className="truncate text-base font-bold text-[#fff3df] transition-colors group-hover:text-[#f0ce8e]">
                      {otherUser?.display_name || 'Unknown Character'}
                    </h3>
                    {conv.last_message_at && (
                      <span className="whitespace-nowrap text-xs font-medium text-[#b9ad9c]">
                        {formatDistanceToNow(new Date(conv.last_message_at), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <p className={`truncate text-sm ${unreadCount > 0 ? 'font-semibold text-[#f4ead7]' : 'text-[#c9bda9]'}`}>
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
    </div>
  );
}
