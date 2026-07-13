import { useState, useEffect } from 'react';
import { X, Send, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../common/Avatar';

interface ShareCreationModalProps {
  onClose: () => void;
  creationType: 'story' | 'character' | 'world' | 'lorebook' | 'whisper';
  creationData: any;
}

export function ShareCreationModal({
  onClose,
  creationType,
  creationData,
}: ShareCreationModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch recent active chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      try {
        // Fetch conversation participants
        const { data: participations, error: pError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (pError) throw pError;
        if (!participations || participations.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const convIds = participations.map(p => p.conversation_id);

        // Fetch other participants
        const { data: others, error: oError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            profiles:user_id(id, user_id, display_name, username, avatar_emoji, photo_url)
          `)
          .in('conversation_id', convIds)
          .neq('user_id', user.id);

        if (oError) throw oError;

        // Fetch conversation details
        const { data: convs, error: cError } = await supabase
          .from('conversations')
          .select('*')
          .in('id', convIds)
          .eq('type', 'dm');

        if (cError) throw cError;

        const list = (convs || []).map(c => {
          const participantInfo = others?.find(o => o.conversation_id === c.id);
          return {
            ...c,
            otherUser: (participantInfo as any)?.profiles
          };
        }).filter(c => c.otherUser);

        setConversations(list);
      } catch (err) {
        console.error('Error loading conversations for sharing:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const handleShareToChat = async (convId: string) => {
    if (!user) return;
    setSharingId(convId);
    try {
      let tag = '';
      if (creationType === 'story') {
        tag = `[Story: ${creationData.title} | ${creationData.summary || ''} | ${creationData.cover_url || ''}]`;
      } else if (creationType === 'character') {
        tag = `[Character: ${creationData.title || creationData.short_description || 'Unnamed Character'} | ${creationData.description || creationData.short_description || ''} | ${creationData.greeting || ''} | ${creationData.id}]`;
      } else if (creationType === 'world') {
        tag = `[World: ${creationData.name || creationData.title} | ${creationData.description || ''}]`;
      } else if (creationType === 'lorebook') {
        tag = `[Lorebook: ${creationData.title} | ${creationData.description || ''} | ${creationData.entry_count || 0}]`;
      } else if (creationType === 'whisper') {
        tag = `Shared a post: "${creationData.content?.substring(0, 100)}..."`;
      }

      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: tag,
        read: false
      });

      if (msgError) throw msgError;

      // Update last message
      await supabase.from('conversations').update({
        last_message: `Shared a ${creationType}`,
        last_message_at: new Date().toISOString()
      }).eq('id', convId);

      showToast(`Successfully shared ${creationType}!`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to share.', 'error');
    } finally {
      setSharingId(null);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.otherUser?.display_name?.toLowerCase().includes(q) || 
           c.otherUser?.username?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-warm-800 rounded-3xl p-6 w-full max-w-md shadow-xl border border-warm-100 dark:border-warm-700 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-bold text-warm-900 dark:text-warm-50 text-base">Share Creation</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 py-2 text-xs"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] pr-1">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-warm-500">
              No conversations found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 hover:bg-warm-50 dark:hover:bg-warm-750 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar emoji={c.otherUser.avatar_emoji || '👤'} photoUrl={c.otherUser.photo_url} size="md" />
                    <div>
                      <h4 className="text-xs font-bold text-warm-900 dark:text-white leading-snug">{c.otherUser.display_name}</h4>
                      <p className="text-[10px] text-warm-500">@{c.otherUser.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShareToChat(c.id)}
                    disabled={sharingId === c.id}
                    className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
                  >
                    {sharingId === c.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={10} />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
