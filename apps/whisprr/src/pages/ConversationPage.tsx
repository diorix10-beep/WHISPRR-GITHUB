import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Send, Phone, Video, Loader2, Trash2,
  Image as ImageIcon, X, Settings, UserPlus, UserMinus, LogOut, Pencil, Smile, Search, ExternalLink
} from 'lucide-react';
import type { Conversation, Message, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { UserBadges } from '../components/common/UserBadges';
import { EmojiPicker } from '../components/common/EmojiPicker';

interface MessageWithProfile extends Message {
  profiles?: Profile;
}

interface ConversationData extends Conversation {
  conversation_participants?: { user_id: string; profiles?: Profile }[];
}

export default function ConversationPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Profile[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [initiating, setInitiating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const MSG_LIMIT = 5000;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch conversation data
  useEffect(() => {
    if (!user || !conversationId) { setLoading(false); return; }

    const fetchConversationData = async () => {
      try {
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select('*, conversation_participants(user_id)')
          .eq('id', conversationId)
          .maybeSingle();

        if (convError) throw convError;
        if (!conv) { navigate('/messages'); return; }

        const isParticipant = (conv.conversation_participants || []).some(
          (p: { user_id: string }) => p.user_id === user.id
        );
        if (!isParticipant) { navigate('/messages'); return; }

        setConversation(conv);

        // Get profiles for all participants
        const participantIds = (conv.conversation_participants || []).map((p: { user_id: string }) => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', participantIds);

        if (profiles) {
          setParticipants(profiles);
          if (conv.type === 'dm') {
            const other = profiles.find(p => p.user_id !== user.id);
            setOtherUser(other || null);
          }
        }

        // Fetch messages
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*, profiles:sender_id(*)')
          .eq('conversation_id', conversationId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (msgsError) throw msgsError;
        setMessages(msgs || []);

        // Check if we should trigger an AI initiation response
        if (conv.type === 'dm' && profiles) {
          const other = profiles.find(p => p.user_id !== user.id);
          if (other && (other.role as string) === 'ai_character') {
            const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
            const now = new Date().getTime();
            const lastMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
            const hoursElapsed = lastMsgTime ? (now - lastMsgTime) / (1000 * 60 * 60) : 9999;

            if ((hoursElapsed > 6 || !msgs || msgs.length === 0) && !initiating) {
              setInitiating(true);
              const sessionRes = await supabase.auth.getSession();
              const token = sessionRes.data.session?.access_token;
              
              fetch('/api/ai-chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  conversation_id: conversationId,
                  bot_user_id: other.user_id,
                  is_initiation: true
                })
              }).catch(err => {
                console.error('Failed to trigger AI initiation:', err);
                setInitiating(false);
              });
            }
          }
        }

        // Mark unread as read
        const unread = (msgs || []).filter(m => !m.read && m.sender_id !== user.id);
        if (unread.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unread.map(m => m.id));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        setLoading(false);
      }
    };

    fetchConversationData();
  }, [user, conversationId, navigate]);

  // Real-time messages + typing presence
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`conversation-${conversationId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const newMsg = payload.new as MessageWithProfile;
        if (newMsg.deleted_at) return;

        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', newMsg.sender_id)
          .maybeSingle();

        setMessages(prev => [...prev, { ...newMsg, profiles: senderProfile ?? undefined }]);

        if (newMsg.sender_id !== user.id) {
          setTypingUsers(prev => prev.filter(id => id !== newMsg.sender_id));
        }

        if (newMsg.sender_id !== user.id && !newMsg.read) {
          await supabase.from('messages').update({ read: true }).eq('id', newMsg.id);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing: string[] = [];
        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== user.id && Array.isArray(presences)) {
            const latest = presences[presences.length - 1] as any;
            if (latest?.typing) typing.push(userId);
          }
        });
        setTypingUsers(typing);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user]);

  // Broadcast typing status
  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current) return;
    channelRef.current.track({ typing: isTyping });
  }, []);

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000);
  };

  // Image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are supported', 'error');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload image to storage
  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('message-attachments')
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from('message-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conversationId || (!messageInput.trim() && !imageFile)) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    broadcastTyping(false);

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadImage(imageFile);
        clearImage();
        setUploadingImage(false);
      }

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content || (imageUrl ? 'Sent an image' : ''),
          image_url: imageUrl,
          read: false,
        });

      if (msgError) throw msgError;

      await supabase
        .from('conversations')
        .update({
          last_message: content || 'Sent an image',
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (otherUser && (otherUser.role as string) === 'ai_character') {
        // Simulate typing status immediately for fluid UI
        setTypingUsers([otherUser.user_id]);

        // Trigger AI reply generation in the background
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes.data.session?.access_token;
        
        fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            bot_user_id: otherUser.user_id
          })
        }).catch(err => {
          console.error('Failed to trigger AI response:', err);
          setTypingUsers([]);
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessageInput(content);
      showToast(`Failed to send message: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await supabase.from('messages').delete().eq('id', messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

  // Group management: rename
  const handleRenameGroup = async () => {
    if (!newGroupName.trim() || !conversationId) return;
    try {
      await supabase.from('conversations').update({ name: newGroupName.trim() }).eq('id', conversationId);
      setConversation(prev => prev ? { ...prev, name: newGroupName.trim() } : prev);
      setEditingName(false);
      showToast('Group renamed', 'success');
    } catch { showToast('Failed to rename', 'error'); }
  };

  // Group management: leave
  const handleLeaveGroup = async () => {
    if (!user || !conversationId) return;
    try {
      await supabase.from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
      navigate('/messages');
    } catch { showToast('Failed to leave group', 'error'); }
  };

  // Group management: remove member
  const handleRemoveMember = async (userId: string) => {
    if (!conversationId) return;
    try {
      await supabase.from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      setParticipants(prev => prev.filter(p => p.user_id !== userId));
      showToast('Member removed', 'success');
    } catch { showToast('Failed to remove member', 'error'); }
  };

  // Group management: add members
  const fetchFollowedForAdd = async () => {
    if (!user) return;
    const existingIds = participants.map(p => p.user_id);
    existingIds.push(user.id);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .not('user_id', 'in', `(${existingIds.join(',')})`)
      .limit(50);

    if (!error) {
      setFollowedUsers(profiles || []);
    }
  };

  const handleMemberSearch = async (query: string) => {
    setMemberSearchQuery(query);
    if (!user) return;
    
    if (query.trim() === '') {
      fetchFollowedForAdd();
      return;
    }
    
    const existingIds = participants.map(p => p.user_id);
    existingIds.push(user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .not('user_id', 'in', `(${existingIds.join(',')})`)
        .limit(20);
      if (!error) {
        setFollowedUsers(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!conversationId) return;
    try {
      await supabase.from('conversation_participants')
        .insert({ conversation_id: conversationId, user_id: userId });
      const added = followedUsers.find(u => u.user_id === userId);
      if (added) {
        setParticipants(prev => [...prev, added]);
        setFollowedUsers(prev => prev.filter(u => u.user_id !== userId));
      }
      showToast('Member added', 'success');
    } catch { showToast('Failed to add member', 'error'); }
  };

  // Get typing display name
  const getTypingDisplay = () => {
    if (typingUsers.length === 0) return null;
    const names = typingUsers.map(id => {
      const p = participants.find(pr => pr.user_id === id);
      return p?.display_name || 'Someone';
    });
    if (names.length === 1) return `${names[0]} is typing...`;
    return `${names.join(', ')} are typing...`;
  };

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const chimeraUrl = isLocalhost ? 'http://localhost:5174' : 'https://chimera.whisprr.xyz';

  const renderRichContent = (content: string) => {
    // 1. Check for Character: [Character: Name | Description | Greeting | Id]
    const charRegex = /\[Character:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|\]]+)(?:\s*\|\s*([^\]]+))?\]/i;
    const charMatch = content.match(charRegex);
    if (charMatch) {
      const name = charMatch[1].trim();
      const desc = charMatch[2].trim();
      const greeting = charMatch[3].trim();
      const charId = charMatch[4] ? charMatch[4].trim() : null;
      return (
        <div className="p-3 my-2 bg-gradient-to-tr from-primary-500/10 to-accent-505/10 dark:from-primary-950/20 dark:to-accent-950/20 rounded-xl border border-primary-100/30 dark:border-primary-900/20 text-warm-900 dark:text-warm-50 text-left min-w-[200px]">
          <div className="font-bold text-xs">🎭 {name}</div>
          <p className="text-xs text-warm-500 italic mt-1 font-serif">"{greeting}"</p>
          <p className="text-[10px] text-warm-600 dark:text-warm-400 mt-1 line-clamp-2">{desc}</p>
          <a
            href={charId ? `${chimeraUrl}/chat/${charId}` : `${chimeraUrl}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-500 hover:underline mt-2"
          >
            Chat in CHIMERA <ExternalLink size={10} />
          </a>
        </div>
      );
    }

    // 2. Check for Story: [Story: Title | Summary | CoverURL]
    const storyRegex = /\[Story:\s*([^|]+)\s*\|\s*([^|]+)\s*(?:\|\s*([^\]]+))?\]/i;
    const storyMatch = content.match(storyRegex);
    if (storyMatch) {
      const title = storyMatch[1].trim();
      const summary = storyMatch[2].trim();
      return (
        <div className="p-3 my-2 bg-white dark:bg-warm-800 rounded-xl border border-warm-200 dark:border-warm-700 text-warm-900 dark:text-warm-50 text-left min-w-[200px]">
          <div className="font-serif font-bold text-xs">📖 {title}</div>
          <p className="text-[10px] text-warm-650 dark:text-warm-350 mt-1 line-clamp-3 leading-normal">{summary}</p>
          <a
            href={`${chimeraUrl}/plots`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-500 hover:underline mt-2"
          >
            Read in CHIMERA <ExternalLink size={10} />
          </a>
        </div>
      );
    }

    // 3. Check for World: [World: Name | Description]
    const worldRegex = /\[World:\s*([^|]+)\s*\|\s*([^\]]+)\]/i;
    const worldMatch = content.match(worldRegex);
    if (worldMatch) {
      const name = worldMatch[1].trim();
      const desc = worldMatch[2].trim();
      return (
        <div className="p-3 my-2 bg-white dark:bg-warm-800 rounded-xl border border-warm-200 dark:border-warm-700 text-warm-900 dark:text-warm-50 text-left min-w-[200px]">
          <div className="font-serif font-bold text-xs">🗺️ {name}</div>
          <p className="text-[10px] text-warm-650 dark:text-warm-350 mt-1 line-clamp-2">{desc}</p>
          <a
            href={`${chimeraUrl}/worlds`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-500 hover:underline mt-2"
          >
            Explore in CHIMERA <ExternalLink size={10} />
          </a>
        </div>
      );
    }

    // 4. Check for Lorebook: [Lorebook: Title | Description | EntryCount]
    const lorebookRegex = /\[Lorebook:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/i;
    const lorebookMatch = content.match(lorebookRegex);
    if (lorebookMatch) {
      const title = lorebookMatch[1].trim();
      const desc = lorebookMatch[2].trim();
      const entryCount = lorebookMatch[3].trim();
      return (
        <div className="p-3 my-2 bg-white dark:bg-warm-800 rounded-xl border border-warm-200 dark:border-warm-700 text-warm-900 dark:text-warm-50 text-left min-w-[200px]">
          <div className="font-serif font-bold text-xs">📚 {title}</div>
          <p className="text-[10px] text-warm-655 dark:text-warm-350 mt-1 line-clamp-2">{desc}</p>
          <a
            href={`${chimeraUrl}/lorebooks`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-500 hover:underline mt-2"
          >
            Manage in CHIMERA <ExternalLink size={10} />
          </a>
        </div>
      );
    }

    // 5. Check for Collaboration: [Collaboration: ...]
    const collabRegex = /\[Collaboration:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|\]]+)(?:\s*\|\s*([^|\]]+))?(?:\s*\|\s*([^\]]+))?\]/i;
    const collabMatch = content.match(collabRegex);
    if (collabMatch) {
      const role = collabMatch[1].trim();
      const title = collabMatch[2].trim();
      const desc = collabMatch[3].trim();
      return (
        <div className="p-3 my-2 bg-white dark:bg-warm-800 rounded-xl border border-warm-200 dark:border-warm-700 text-warm-900 dark:text-warm-50 text-left min-w-[200px]">
          <div className="text-[10px] bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded font-bold uppercase w-max mb-1">🔍 {role.replace('_', ' ')}</div>
          <div className="font-bold text-xs">{title}</div>
          <p className="text-[10px] text-warm-655 dark:text-warm-350 mt-1 line-clamp-2">{desc}</p>
        </div>
      );
    }

    // 6. Check for Progress: [Progress: ...]
    const progressRegex = /\[Progress:\s*([^|]+)\s*\|\s*([^|%\]]+)%?\s*\|\s*([^\]]+)\]/i;
    const progressMatch = content.match(progressRegex);
    if (progressMatch) {
      const projectName = progressMatch[1].trim();
      const percentage = Math.min(Math.max(parseInt(progressMatch[2].trim()) || 0, 0), 100);
      const notes = progressMatch[3].trim();
      return (
        <div className="p-3 my-2 bg-white dark:bg-warm-800 rounded-xl border border-warm-200 dark:border-warm-700 text-warm-900 dark:text-warm-50 text-left min-w-[200px]">
          <div className="flex justify-between text-[10px] font-bold text-warm-500 mb-1">
            <span>📈 {projectName}</span>
            <span className="text-primary-500">{percentage}%</span>
          </div>
          <div className="w-full bg-warm-100 dark:bg-warm-900 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-primary-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-[10px] text-warm-600 dark:text-warm-450 leading-relaxed font-semibold italic">"{notes}"</p>
        </div>
      );
    }

    return <p className="text-sm">{content}</p>;
  };

  const isGroupAdmin = conversation?.type === 'group' && conversation?.created_by === user?.id;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-warm-50 dark:bg-warm-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-warm-800 border-b border-warm-200 dark:border-warm-700">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => navigate('/messages')} className="btn-ghost p-2 -ml-2">
              <ArrowLeft size={24} />
            </button>

            {conversation?.type === 'dm' && otherUser && (
              <div className="flex items-center gap-3 min-w-0">
                <Avatar emoji={otherUser.avatar_emoji} photoUrl={otherUser.photo_url} size="md" />
                <div className="min-w-0">
                  <h1 className="font-medium text-warm-900 dark:text-warm-100 truncate flex items-center">
                    {otherUser.display_name}
                    <UserBadges badges={otherUser.badges} role={otherUser.role} size="sm" />
                  </h1>
                  <p className="text-xs text-warm-500">@{otherUser.username}</p>
                </div>
              </div>
            )}

            {conversation?.type === 'group' && (
              <div className="min-w-0">
                <h1 className="font-medium text-warm-900 dark:text-warm-100 truncate">
                  {conversation.name || 'Group Chat'}
                </h1>
                <p className="text-xs text-warm-500">{participants.length} members</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {conversation?.type === 'dm' && (
              <>
                <button onClick={() => showToast('Voice calls coming soon!', 'info')} className="btn-ghost p-2">
                  <Phone size={20} />
                </button>
                <button onClick={() => showToast('Video calls coming soon!', 'info')} className="btn-ghost p-2">
                  <Video size={20} />
                </button>
              </>
            )}
            {conversation?.type === 'group' && (
              <button onClick={() => setShowGroupSettings(true)} className="btn-ghost p-2">
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-warm-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => {
            const isOwn = message.sender_id === user?.id;
            const sender = message.profiles;

            return (
              <div key={message.id} className={`group flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && conversation?.type === 'group' && (
                  <Avatar emoji={sender?.avatar_emoji || '?'} photoUrl={sender?.photo_url || null} size="sm" />
                )}

                <div className="relative max-w-[75%]">
                  <div className={`px-4 py-2.5 rounded-2xl break-words ${
                    isOwn
                      ? 'bg-primary-500 text-white rounded-br-none'
                      : 'bg-warm-100 dark:bg-warm-700 text-warm-900 dark:text-warm-100 rounded-bl-none'
                  }`}>
                    {!isOwn && conversation?.type === 'group' && sender && (
                      <p className="text-xs font-semibold opacity-75 mb-1 flex items-center gap-0.5">
                        {sender.display_name}
                        <UserBadges badges={sender.badges} role={sender.role} size="sm" />
                      </p>
                    )}

                    {message.image_url && (
                      <img
                        src={message.image_url}
                        alt="Shared image"
                        className="rounded-xl max-w-full mb-2 cursor-pointer"
                        onClick={() => window.open(message.image_url!, '_blank')}
                      />
                    )}

                    {message.content && message.content !== 'Sent an image' && (
                      renderRichContent(message.content)
                    )}

                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-warm-500'}`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
                    </p>
                  </div>

                  {isOwn && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-warm-200 dark:hover:bg-warm-600"
                      title="Delete message"
                    >
                      <Trash2 size={14} className="text-warm-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {getTypingDisplay() && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-warm-500">{getTypingDisplay()}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="max-w-lg mx-auto w-full px-4 pb-2">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-xl object-cover" />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-warm-800 text-white rounded-full p-1"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="sticky bottom-0 bg-white dark:bg-warm-800 border-t border-warm-100 dark:border-warm-700">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-2">
          {showEmojiPicker && (
            <div className="animate-scale-in">
              <EmojiPicker
                onSelect={emoji => {
                  setMessageInput(prev => prev + emoji);
                  setShowEmojiPicker(false);
                  msgInputRef.current?.focus();
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
          <div className="flex items-end gap-2">
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost p-2 flex-shrink-0 mb-0.5"
              disabled={sending}
              aria-label="Attach image"
            >
              <ImageIcon size={20} className="text-warm-500" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              className="btn-ghost p-2 flex-shrink-0 mb-0.5"
              disabled={sending}
              aria-label="Insert emoji"
            >
              <Smile size={20} className="text-warm-500" />
            </button>
            <textarea
              ref={msgInputRef}
              value={messageInput}
              onChange={e => { handleInputChange(e.target.value); }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Type a message… (Shift+Enter for new line)"
              className="input-field flex-1 resize-none overflow-y-auto"
              style={{ minHeight: '2.75rem', maxHeight: '8rem', height: 'auto' }}
              maxLength={MSG_LIMIT}
              disabled={sending}
              rows={1}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />
            <button
              type="submit"
              disabled={sending || (!messageInput.trim() && !imageFile)}
              className="btn-primary flex items-center justify-center gap-2 py-2.5 px-4 disabled:opacity-50 flex-shrink-0 mb-0.5"
              aria-label="Send message"
            >
              {sending || uploadingImage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          {messageInput.length > MSG_LIMIT * 0.85 && (
            <p className={`text-xs text-right tabular-nums ${messageInput.length > MSG_LIMIT ? 'text-error-600' : 'text-warm-400'}`}>
              {messageInput.length}/{MSG_LIMIT}
            </p>
          )}
        </div>
      </form>

      {/* Group Settings Modal */}
      {showGroupSettings && conversation?.type === 'group' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-warm-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-warm-800 border-b border-warm-200 dark:border-warm-700 p-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-100">
                Group Settings
              </h2>
              <button onClick={() => { setShowGroupSettings(false); setShowAddMembers(false); setEditingName(false); }} className="btn-ghost p-2">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Group Name */}
              <div>
                <label className="text-sm font-medium text-warm-700 dark:text-warm-300 mb-2 block">Group Name</label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      className="input-field flex-1"
                      autoFocus
                    />
                    <button onClick={handleRenameGroup} className="btn-primary px-4">Save</button>
                    <button onClick={() => setEditingName(false)} className="btn-secondary px-4">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-warm-900 dark:text-warm-100 font-medium">
                      {conversation.name || 'Group Chat'}
                    </span>
                    {isGroupAdmin && (
                      <button onClick={() => { setNewGroupName(conversation.name || ''); setEditingName(true); }} className="btn-ghost p-2">
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-warm-700 dark:text-warm-300">
                    Members ({participants.length})
                  </label>
                  {isGroupAdmin && (
                    <button
                      onClick={() => { setShowAddMembers(true); fetchFollowedForAdd(); }}
                      className="text-primary-500 text-sm font-medium flex items-center gap-1"
                    >
                      <UserPlus size={16} /> Add
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.user_id} className="flex items-center gap-3 p-2 rounded-xl">
                      <Avatar emoji={p.avatar_emoji} photoUrl={p.photo_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-warm-900 dark:text-warm-100 truncate text-sm">
                          {p.display_name}
                          {p.user_id === conversation.created_by && (
                            <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-warm-500">@{p.username}</p>
                      </div>
                      {isGroupAdmin && p.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(p.user_id)}
                          className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                          title="Remove member"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Members Panel */}
              {showAddMembers && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-warm-700 dark:text-warm-300 block">
                    Add members
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-warm-400" />
                    <input
                      type="text"
                      placeholder="Search users to add..."
                      value={memberSearchQuery}
                      onChange={e => handleMemberSearch(e.target.value)}
                      className="input-field pl-9 py-1.5 text-sm"
                    />
                  </div>
                  {followedUsers.length === 0 ? (
                    <p className="text-sm text-warm-500 py-4 text-center">
                      No matching users found
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {followedUsers.map(fu => (
                        <div key={fu.user_id} className="flex items-center gap-3 p-2 rounded-xl">
                          <Avatar emoji={fu.avatar_emoji} photoUrl={fu.photo_url} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-warm-900 dark:text-warm-100 truncate text-sm">{fu.display_name}</p>
                            <p className="text-xs text-warm-500">@{fu.username}</p>
                          </div>
                          <button
                            onClick={() => {
                              handleAddMember(fu.user_id);
                              setMemberSearchQuery('');
                            }}
                            className="text-primary-500 text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leave Group */}
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              >
                <LogOut size={18} />
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
