import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Send, Phone, Video, Loader2, Trash2, Share2,
  Image as ImageIcon, X, Settings, UserPlus, UserMinus, LogOut, Pencil, Smile, Search,
  PanelRightClose, PanelRightOpen, BookOpen, Copy, RotateCw, Edit3, Camera, Volume2
} from 'lucide-react';
import type { Conversation, Message, Profile, MemoryNexusState, ChatMode, MultiCharacterParticipant, RpgGameState, RpgChoice, LorebookEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { UserBadges } from '../components/common/UserBadges';
import { EmojiPicker } from '../components/common/EmojiPicker';
import { ChatSettingsDrawer } from '../components/chat/ChatSettingsDrawer';
import { ChatMemoryModal } from '../components/chat/ChatMemoryModal';
import { MockPhoneModal } from '../components/chat/MockPhoneModal';
import { MemoryVisualizerModal } from '../components/chat/MemoryVisualizerModal';
import { MultiCharacterHeader } from '../components/chat/MultiCharacterHeader';
import { GuidedTurningPointCard, type GuidedTurningPoint } from '../components/chat/GuidedTurningPointCard';
import { LorebookDrawer } from '../components/chat/LorebookDrawer';
import { InChatPersonaDrawer } from '../components/chat/InChatPersonaDrawer';
import { WorldRelationshipModal } from '../components/world/WorldRelationshipModal';
import { TranscriptsExporterModal } from '../components/chat/TranscriptsExporterModal';
import { AddCharacterToGroupModal } from '../components/chat/AddCharacterToGroupModal';
import { voiceEngine } from '../services/voiceEngine';
import { LanguageSelectorModal } from '../components/common/LanguageSelectorModal';
import { SUPPORTED_LANGUAGES, translateText } from '../services/translationEngine';
import { createInitialMemoryNexusState, autoExtractMemoriesIfNeeded, formatMemoryNexusPromptContext } from '../services/memoryNexus';
import { generateElevenLabsAudio } from '../lib/elevenlabs';
import { scanAndMatchLorebookEntries, parseJanitorLorebookJson, parseOocMessage } from '../services/lorebookEngine';
import { checkUserPromptSafety, CRISIS_HELPLINE_INFO } from '../lib/safetyGuard';
import { useChatAesthetics } from '../hooks/useChatAesthetics';
import { useVoice } from '../hooks/useVoice';
import { RoleplaySafetyPauseCard } from '../components/chat/RoleplaySafetyPauseCard';
import { CharacterExpressionAvatar } from '../components/character/CharacterExpressionAvatar';
import { CharacterExpressionManagerModal } from '../components/character/CharacterExpressionManagerModal';
import { Paperclip, AudioWaveform, Brain, Gamepad2, Users, Globe, UserCheck } from 'lucide-react';

interface MessageWithProfile extends Message {
  profiles?: Profile;
}

interface ConversationData extends Conversation {
  conversation_participants?: { user_id: string; profiles?: Profile }[];
}

export default function ConversationPage() {
  const navigate = useNavigate();
  // The route is `/conversations/:id`; retaining the same local name keeps
  // the rest of the chat runtime readable while ensuring the page actually
  // receives the route parameter.
  const { id: conversationId } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [turningPoint, setTurningPoint] = useState<GuidedTurningPoint | null>(null);
  const [turningPointLoading, setTurningPointLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Profile[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [initiating, setInitiating] = useState(false);
  const [showContextDrawer, setShowContextDrawer] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showSceneCanon, setShowSceneCanon] = useState(false);
  const [sceneCanon, setSceneCanon] = useState('');
  const [sceneCanonDraft, setSceneCanonDraft] = useState('');
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  // Memory Nexus State & Visualizer Modal
  const [memoryNexusState, setMemoryNexusState] = useState<MemoryNexusState>(createInitialMemoryNexusState());
  const [showMemoryVisualizer, setShowMemoryVisualizer] = useState(false);
  const [showExporterModal, setShowExporterModal] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [showLangModal, setShowLangModal] = useState(false);
  const [swipesMap, setSwipesMap] = useState<Record<string, { variations: string[]; currentIndex: number }>>({});
  const [showAddCharModal, setShowAddCharModal] = useState(false);
  const [showExpressionModal, setShowExpressionModal] = useState(false);
  const [characterExpressions, setCharacterExpressions] = useState<Record<string, string>>({});
  const [showPublishSceneModal, setShowPublishSceneModal] = useState(false);
  const [publishingScene, setPublishingScene] = useState(false);
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneSummary, setSceneSummary] = useState('');
  const [sceneVisibility, setSceneVisibility] = useState<'unlisted' | 'public'>('unlisted');
  const [sceneRating, setSceneRating] = useState<'limited' | 'mature'>('limited');

  // Roleplay Safety Intervention State
  const [isRoleplayPaused, setIsRoleplayPaused] = useState(false);

  // Lorebook & Janitor AI Engine State
  const [lorebookEntries, setLorebookEntries] = useState<LorebookEntry[]>([
    {
      id: 'demo-1',
      lorebook_id: 'default',
      title: 'CHIMERA Universe',
      content: 'CHIMERA is a vast multi-dimensional nexus where stories, roleplays, and worlds converge.',
      keywords: ['CHIMERA', 'Nexus', 'Universe'],
      priority: 10,
      enabled: true,
      is_constant: true,
      insertion_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const [showLorebookDrawer, setShowLorebookDrawer] = useState(false);
  const [scanDepth, setScanDepth] = useState<number>(10);
  const [isOocMode, setIsOocMode] = useState<boolean>(false);
  const [showPersonaDrawer, setShowPersonaDrawer] = useState<boolean>(false);
  const [showWorldModal, setShowWorldModal] = useState<boolean>(false);
  const [activePersona, setActivePersona] = useState<any>(null);
  const [suggestedPersona, setSuggestedPersona] = useState<any>(null);

  // Lore-Style Response Length, Story Tone, POV & Pinned Messages Controls
  const [creativeMode, setCreativeModeState] = useState<'roleplay' | 'storytelling'>(() => {
    return (localStorage.getItem('chimera_creative_mode') as 'roleplay' | 'storytelling') || 'roleplay';
  });
  const [storyTone, setStoryTone] = useState<'Romantic' | 'Dark' | 'Comedy' | 'Mystery' | 'Fantasy' | 'Slice of Life'>('Fantasy');
  const [storyPov, setStoryPov] = useState<'First Person' | 'Third Person' | 'Character POV'>('Third Person');
  const [responseLength, setResponseLength] = useState<'short' | 'balanced' | 'detailed'>('balanced');
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`pinned_msgs_${conversationId}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const togglePinMessage = (msgId: string) => {
    setPinnedMessageIds(prev => {
      const next = prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId];
      try { localStorage.setItem(`pinned_msgs_${conversationId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Mobile Touch Swipe Gesture Handling
  const touchStartXRef = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartXRef.current;
    if (diff > 80) {
      setShowSettingsDrawer(true);
    } else if (diff < -80) {
      setShowMemoryModal(true);
    }
  };

  // Chat Modes & Multi-Character Pool
  const [chatMode, setChatMode] = useState<ChatMode>('one_on_one');
  const [multiParticipants, setMultiParticipants] = useState<MultiCharacterParticipant[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // RPG Game Mode State
  const [rpgGameState, setRpgGameState] = useState<RpgGameState>({
    current_objective: 'Begin your journey and investigate the surroundings.',
    progress_percent: 15,
    inventory: ['Rusty Sword', 'Health Potion'],
    stats: { HP: 100, Mana: 50, Level: 1 },
    available_choices: [
      { id: 'c1', key: 'A', label: 'Explore the dark forest ahead' },
      { id: 'c2', key: 'B', label: 'Speak to the tavern keeper' },
      { id: 'c3', key: 'C', label: 'Inspect your inventory and gear' },
    ],
    game_over: false,
  });

  const voice = useVoice();
  const aesthetics = useChatAesthetics(conversationId);

  const loreTriggerResult = scanAndMatchLorebookEntries(messages, lorebookEntries, {
    defaultScanDepth: scanDepth,
  });

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

  const voiceEnabledRef = useRef(voice.isEnabled);
  const voiceSpeakRef = useRef(voice.speak);

  useEffect(() => {
    voiceEnabledRef.current = voice.isEnabled;
    voiceSpeakRef.current = voice.speak;
  }, [voice.isEnabled, voice.speak]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Magic Trigger: Auto-Phone Layout Detection
  useEffect(() => {
    if (messages.length === 0) return;
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage.content) return;
    
    const contentLower = latestMessage.content.toLowerCase();
    const phoneKeywords = [
      'open my phone', 'opened my phone', 'took out my phone', 'take out my phone',
      'look at my phone', 'looks at phone', 'texting', 'unlocked screen', 'unlocks screen',
      'pulls out phone', 'pull out my phone', 'grabs phone'
    ];

    const closePhoneKeywords = [
      'put my phone away', 'puts phone away', 'turned off my phone', 'turns off phone',
      'locked my screen', 'locks screen', 'put the phone back', 'put phone back',
      'puts phone back', 'pocket the phone', 'slide my phone'
    ];

    const hasPhoneKeyword = phoneKeywords.some(kw => contentLower.includes(kw));
    const hasCloseKeyword = closePhoneKeywords.some(kw => contentLower.includes(kw));
    
    if (hasPhoneKeyword && !isPhoneOpen && !hasCloseKeyword) {
      setIsPhoneOpen(true);
    } else if (hasCloseKeyword && isPhoneOpen) {
      setIsPhoneOpen(false);
    }
  }, [messages, isPhoneOpen]);

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
        if (!conv) { navigate('/conversations'); return; }

        const isParticipant = (conv.conversation_participants || []).some(
          (p: { user_id: string }) => p.user_id === user.id
        );
        if (!isParticipant) { navigate('/conversations'); return; }

        setConversation(conv);
        setSceneCanon(conv.memory_summary || '');
        setSceneCanonDraft(conv.memory_summary || '');

        const { data: activeTurningPoint } = await supabase
          .from('roleplay_turning_points')
          .select('id, title, scene_prompt, choices, reward_shards, status, selected_choice_id')
          .eq('conversation_id', conversationId)
          .eq('status', 'active')
          .maybeSingle();
        setTurningPoint((activeTurningPoint || null) as GuidedTurningPoint | null);

        // Get profiles for all participants
        const participantIds = (conv.conversation_participants || []).map((p: { user_id: string }) => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', participantIds);

        let botProfile: Profile | null = null;
        if (conv.character_id) {
          const { data: aiChar } = await supabase
            .from('ai_characters')
            .select('*')
            .or(`id.eq.${conv.character_id},user_id.eq.${conv.character_id}`)
            .maybeSingle();

          if (aiChar) {
            botProfile = {
              id: aiChar.id,
              // Messages and conversation participants are keyed to the bot's
              // profile user id, not the separate ai_characters record id.
              user_id: aiChar.user_id,
              display_name: aiChar.name || aiChar.display_name || 'AI Character',
              username: aiChar.creator_username || 'bot',
              photo_url: aiChar.photo_url || aiChar.avatar_url || null,
              avatar_emoji: '🎭',
              role: 'ai_character',
              bio: aiChar.short_description || aiChar.long_description || '',
              onboarding_complete: true,
              created_at: aiChar.created_at || new Date().toISOString(),
              updated_at: aiChar.updated_at || new Date().toISOString(),
              greeting: aiChar.greeting || ''
            } as any;
          }
        }

        if (profiles) {
          setParticipants(profiles);
          const nonUserProfiles = profiles.filter(p => p.user_id !== user.id);
          if (conv.type === 'dm') {
            const other = botProfile || nonUserProfiles[0] || null;
            setOtherUser(other);
          }
          const initialMulti: MultiCharacterParticipant[] = (botProfile ? [botProfile] : nonUserProfiles).map((p, idx) => ({
            character_id: p.user_id,
            display_name: p.display_name,
            username: p.username,
            avatar_emoji: p.avatar_emoji,
            photo_url: p.photo_url,
            personality_summary: p.bio,
            is_active_speaker: idx === 0,
          }));
          setMultiParticipants(initialMulti);
          if (initialMulti.length > 0) {
            setActiveSpeakerId(initialMulti[0].character_id);
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
        const loadedMsgs = msgs || [];
        setMessages(loadedMsgs);

        // Memory Nexus currently remains a session visualization. Persistent
        // continuity for the runtime is the conversation's saved scene canon.
        // It must not silently invent or inject random "memories" into a model.
        if (loadedMsgs.length > 0) {
          setMemoryNexusState((prev) => autoExtractMemoriesIfNeeded(loadedMsgs, prev, conversationId));
        }

        // Check if we should trigger an AI initiation response or insert character greeting
        if (conv.type === 'dm' && profiles) {
          const other = profiles.find(p => p.user_id !== user.id);
          if (other && (other.role as string) === 'ai_character') {
            if (loadedMsgs.length === 0) {
              // Fetch character greeting from ai_characters table if available
              let greetingText = '';
              try {
                const { data: charData } = await supabase
                  .from('ai_characters')
                  .select('greeting, name, short_description')
                  .or(`user_id.eq.${other.user_id},id.eq.${other.user_id}`)
                  .maybeSingle();

                greetingText = charData?.greeting || '';
              } catch {}

              if (greetingText) {
                const { data: newGreetingMsg, error: greetingError } = await supabase
                  .from('messages')
                  .insert({
                    conversation_id: conversationId,
                    sender_id: other.user_id,
                    content: greetingText,
                    read: true
                  })
                  .select('*, profiles:sender_id(*)')
                  .single();

                if (greetingError) throw greetingError;
                if (newGreetingMsg) setMessages([newGreetingMsg]);
              } else {
                // A missing creator greeting is not permission to fabricate a
                // generic assistant greeting. Let the character runtime open
                // the scene from its real definition instead.
                setInitiating(true);
                try {
                  const sessionRes = await supabase.auth.getSession();
                  const token = sessionRes.data.session?.access_token;
                  const response = await fetch('/api/ai-chat', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      conversation_id: conversationId,
                      bot_user_id: other.user_id,
                      is_initiation: true,
                    }),
                  });
                  const data = await response.json().catch(() => ({}));
                  if (!response.ok || !data?.reply) {
                    throw new Error(data?.error || 'The character could not open this scene.');
                  }
                  const { data: updatedMsgs } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });
                  if (updatedMsgs) setMessages(updatedMsgs);
                } finally {
                  setInitiating(false);
                }
              }
            } else {
              const lastMsg = loadedMsgs[loadedMsgs.length - 1];
              const now = new Date().getTime();
              const lastMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
              const hoursElapsed = lastMsgTime ? (now - lastMsgTime) / (1000 * 60 * 60) : 9999;

              if (hoursElapsed > 6 && !initiating) {
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
                })
                  .then(async (res) => {
                    setInitiating(false);
                    const data = await res.json();
                    if (data?.reply) {
                      const { data: updatedMsgs } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conversationId)
                        .order('created_at', { ascending: true });
                      if (updatedMsgs) setMessages(updatedMsgs);
                    }
                  })
                  .catch(err => {
                    console.error('Failed to trigger AI initiation:', err);
                    setInitiating(false);
                  });
              }
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

        if (senderProfile?.role === 'ai_character' && voiceEnabledRef.current) {
          voiceSpeakRef.current(newMsg.content);
        }

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

  const saveSceneCanon = async () => {
    if (!conversationId) return;
    const next = sceneCanonDraft.trim();
    const { error } = await supabase.from('conversations').update({ memory_summary: next }).eq('id', conversationId);
    if (error) { showToast('Could not save the scene canon.', 'error'); return; }
    setSceneCanon(next);
    setShowSceneCanon(false);
    showToast('This scene will remember that.', 'success');
  };

  const openTurningPoint = async () => {
    if (!conversationId || !otherUser?.user_id || turningPointLoading) return;
    setTurningPointLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch('/api/roleplay-turning-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionData.session?.access_token || ''}` },
        body: JSON.stringify({ conversation_id: conversationId, bot_user_id: otherUser.user_id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not open a turning point.');
      setTurningPoint(payload.turning_point as GuidedTurningPoint);
      showToast('A turning point has opened in this scene.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not open a turning point.', 'error');
    } finally {
      setTurningPointLoading(false);
    }
  };

  const chooseTurningPoint = async (choice: GuidedTurningPoint['choices'][number]) => {
    if (!turningPoint || turningPointLoading) return;
    setTurningPointLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_my_roleplay_turning_point', { p_turning_point_id: turningPoint.id, p_choice_id: choice.id });
      if (error) throw error;
      const reward = data?.[0];
      setTurningPoint(null);
      setMessageInput(`[Turning Point — ${choice.key}]: ${choice.label}`);
      if (reward?.memory_note) setSceneCanon((current) => [current, reward.memory_note].filter(Boolean).join('\n'));
      window.dispatchEvent(new Event('chimera-shards-changed'));
      showToast(`A new path has opened. +${reward?.shards_awarded ?? 10} SHARDS`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not resolve this turning point.', 'error');
    } finally {
      setTurningPointLoading(false);
    }
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

    let content = messageInput.trim();

    // Check Safety Guard for self-harm/suicide or severe policy violations
    const safetyCheck = checkUserPromptSafety(content);
    if (!safetyCheck.isSafe) {
      if (safetyCheck.crisisTriggered) {
        showToast(`💜 Help is available. Call/text ${CRISIS_HELPLINE_INFO.phone} (${CRISIS_HELPLINE_INFO.name}). You are not alone.`, 'error');
      }
      setIsRoleplayPaused(true);
      setMessageInput('');
      return;
    }

    // Reset safety pause if user sends compliant message
    setIsRoleplayPaused(false);

    if (isOocMode && content && !content.startsWith('(OOC:') && !content.startsWith('[OOC:')) {
      content = `(OOC: ${content})`;
    }

    // Check OOC Lore Request
    const oocParsed = parseOocMessage(content);
    if (oocParsed.isOoc) {
      // Only persist instructions that establish continuing scene canon or
      // writing preferences. Regular OOC questions remain one-turn context.
      const isPersistentInstruction = /\b(remember|keep|always|never|scene|setting|location|tone|style|pace|do not|don't)\b/i.test(oocParsed.oocContent);
      if (isPersistentInstruction) {
        const { data: currentConversation, error: contextLoadError } = await supabase
          .from('conversations')
          .select('memory_summary')
          .eq('id', conversationId)
          .single();

        if (contextLoadError) throw contextLoadError;

        const instruction = `• ${oocParsed.oocContent}`;
        const existingContext = currentConversation?.memory_summary || '';
        if (!existingContext.includes(instruction)) {
          const { error: contextSaveError } = await supabase
            .from('conversations')
            .update({ memory_summary: [existingContext, instruction].filter(Boolean).join('\n') })
            .eq('id', conversationId);
          if (contextSaveError) throw contextSaveError;
          showToast('Scene instruction saved for this roleplay.', 'success');
        }
      }
    }
    if (oocParsed.isOoc && oocParsed.isCreateLoreRequest && oocParsed.loreTopic) {
      const topic = oocParsed.loreTopic;
      const autoEntry: LorebookEntry = {
        id: `ooc-${Date.now()}`,
        lorebook_id: 'default',
        title: topic.charAt(0).toUpperCase() + topic.slice(1),
        content: `Lore details for ${topic} established during RP: ${oocParsed.oocContent}`,
        keywords: [topic, topic.toLowerCase()],
        priority: 10,
        enabled: true,
        insertion_order: lorebookEntries.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLorebookEntries((prev) => [...prev, autoEntry]);
      showToast(`✨ Created Lorebook entry for "${topic}"!`, 'success');
    }

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

        // Compute current triggered lore context
        const loreRes = scanAndMatchLorebookEntries(messages, lorebookEntries, {
          defaultScanDepth: scanDepth,
        });

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
            bot_user_id: otherUser.user_id,
            lorebook_context: loreRes.compiledPromptText,
            memory_nexus_context: formatMemoryNexusPromptContext(memoryNexusState),
            chat_mode: chatMode,
            active_speaker_id: activeSpeakerId,
          })
        })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(data?.error || 'The character could not generate a reply.');
            }
            return data;
          })
          .then(async (data) => {
            setTypingUsers([]);
            if (data?.pause_roleplay) {
              setIsRoleplayPaused(true);
            } else if (data?.reply) {
              // Refresh messages immediately in case Supabase Realtime connection drops on mobile
              const { data: updatedMsgs } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
              if (updatedMsgs) setMessages(updatedMsgs);
            }
          })
          .catch((err) => {
            console.error('AI reply generation failed:', err);
            setTypingUsers([]);
            showToast('Your message was saved, but the character could not reply. Please try again.', 'error');
          });
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
      msgInputRef.current?.focus();
    }
  };

  const handlePhoneSendMessage = async (content: string) => {
    if (!user || !conversationId) return;
    
    try {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content,
          read: false,
        });

      if (msgError) throw msgError;

      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (otherUser && (otherUser.role as string) === 'ai_character') {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes.data.session?.access_token;
        
        fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ conversation_id: conversationId, bot_user_id: otherUser.user_id })
        }).catch(err => console.error(err));
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to send text', 'error');
    }
  };

  // Request Selfie / Image Studio
  const [requestingImage, setRequestingImage] = useState(false);
  const handleRequestImage = async () => {
    if (!user || requestingImage || !otherUser) return;

    setRequestingImage(true);
    try {
      const characterName = otherUser.display_name;
      const prompt = `a highly detailed, beautiful selfie photo of ${characterName}, realistic, atmospheric lighting, 8k, photorealistic`;
      const encodedPrompt = encodeURIComponent(prompt);
      
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1200&nologo=true&seed=${seed}`;

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: otherUser.user_id,
          content: `*Sends you a photo*`,
          image_url: imageUrl,
          read: true,
        });

      if (msgError) throw msgError;
      showToast('Image generated successfully!', 'success');
      
      if (aesthetics.layoutStyle !== 'phone') {
        aesthetics.setLayout('phone');
        aesthetics.setChatStyle('imessage');
      }

    } catch (err) {
      console.error(err);
      showToast('Failed to generate image', 'error');
    } finally {
      setRequestingImage(false);
    }
  };

  const [convertingToStory, setConvertingToStory] = useState(false);
  const handleContinueAsStory = async () => {
    if (!user || messages.length === 0) return;
    setConvertingToStory(true);
    try {
      const activeMsgs = messages.filter(m => !m.deleted_at);
      const storyText = activeMsgs.map(m => {
        const senderName = m.profiles?.display_name || (m.sender_id === user.id ? 'You' : 'Character');
        return `**${senderName}**: ${m.content}`;
      }).join('\n\n');

      const titleName = otherUser?.display_name || 'Roleplay Session';

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: `Story of ${titleName}`,
          summary: `Converted from interactive roleplay session on ${new Date().toLocaleDateString()}`,
          visibility: 'private'
        })
        .select()
        .single();

      if (storyError) throw storyError;

      const { data: chapter, error: chapterError } = await supabase
        .from('story_chapters')
        .insert({
          story_id: story.id,
          chapter_number: 1,
          title: 'Chapter 1: The Encounter',
          content: storyText
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      showToast('Successfully converted roleplay to Story!', 'success');
      navigate(`/stories/${story.id}/chapters/${chapter.id}/edit`);
    } catch (err: any) {
      console.error('Error converting to story:', err);
      showToast(err.message || 'Failed to convert to story', 'error');
    } finally {
      setConvertingToStory(false);
    }
  };

  // Soft delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      showToast('Message deleted', 'success');
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

  // Edit message
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;
    try {
      await supabase.from('messages').update({ content: editContent.trim() }).eq('id', editingMessageId);
      setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content: editContent.trim() } : m));
      setEditingMessageId(null);
      showToast('Message updated', 'success');
    } catch (error) {
      console.error('Error editing message:', error);
      showToast('Failed to update message', 'error');
    }
  };

  // Response Swiping Engine (Janitor AI & SillyTavern Style)
  const handleSwipeChange = async (messageId: string, direction: 'left' | 'right') => {
    const current = swipesMap[messageId];
    if (!current || current.variations.length <= 1) return;

    let newIndex = direction === 'left' ? current.currentIndex - 1 : current.currentIndex + 1;
    if (newIndex < 0) newIndex = current.variations.length - 1;
    if (newIndex >= current.variations.length) newIndex = 0;

    const newContent = current.variations[newIndex];
    setSwipesMap(prev => ({
      ...prev,
      [messageId]: { ...current, currentIndex: newIndex }
    }));

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent } : m));
    await supabase.from('messages').update({ content: newContent }).eq('id', messageId);
  };

  const handleSwipeNew = async (messageId: string) => {
    if (!conversationId || !otherUser || (otherUser.role as string) !== 'ai_character') return;
    try {
      const targetMsg = messages.find(m => m.id === messageId);
      if (!targetMsg) return;

      showToast('Generating new response variation...', 'info');
      setTypingUsers([otherUser.user_id]);

      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token;

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          bot_user_id: otherUser.user_id,
          is_swipe: true
        })
      });

      const data = await res.json();
      if (data && data.reply) {
        const newVariation = data.reply;
        const existing = swipesMap[messageId] || { variations: [targetMsg.content || ''], currentIndex: 0 };
        const updatedVariations = [...existing.variations, newVariation];
        const newIdx = updatedVariations.length - 1;

        setSwipesMap(prev => ({
          ...prev,
          [messageId]: { variations: updatedVariations, currentIndex: newIdx }
        }));

        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newVariation } : m));
        await supabase.from('messages').update({ content: newVariation }).eq('id', messageId);
        showToast(`Swiped variation (${newIdx + 1}/${updatedVariations.length})`, 'success');
      }
    } catch (err) {
      console.error('Failed to swipe new variation:', err);
      showToast('Failed to generate swipe variation', 'error');
    } finally {
      setTypingUsers([]);
    }
  };

  const handleBranchFromMessage = async (messageId: string) => {
    const targetIdx = messages.findIndex(m => m.id === messageId);
    if (targetIdx === -1) return;

    showToast('Branching narrative from this point...', 'info');
    const toDelete = messages.slice(targetIdx + 1).map(m => m.id);
    if (toDelete.length > 0) {
      await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).in('id', toDelete);
      setMessages(prev => prev.slice(0, targetIdx + 1));
    }
    showToast('Narrative branched!', 'success');
  };

  // Regenerate AI Response
  const handleRegenerateMessage = async (messageId: string) => {
    await handleSwipeNew(messageId);
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
      navigate('/conversations');
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

  const openPublishSceneModal = () => {
    const fallbackTitle = otherUser ? `${otherUser.display_name} — a CHIMERA scene` : 'A CHIMERA roleplay scene';
    setSceneTitle((current) => current || fallbackTitle);
    setShowPublishSceneModal(true);
  };

  const handlePublishScene = async () => {
    if (!user || !conversation || !conversationId) return;
    if (conversation.type !== 'dm' || conversation.created_by !== user.id) {
      showToast('Only the person who started this private roleplay can share a scene.', 'error');
      return;
    }

    const title = sceneTitle.trim();
    const summary = sceneSummary.trim();
    const activeMessages = messages.filter((message) => !message.deleted_at && message.content.trim());
    if (!title) {
      showToast('Give this scene a title before sharing it.', 'error');
      return;
    }
    if (activeMessages.length === 0) {
      showToast('A scene needs at least one message before it can be shared.', 'error');
      return;
    }

    setPublishingScene(true);
    try {
      const { data: scene, error: sceneError } = await supabase
        .from('roleplay_public_scenes')
        .insert({
          conversation_id: conversationId,
          owner_id: user.id,
          title,
          summary,
          visibility: sceneVisibility,
          content_rating: sceneRating,
        })
        .select('id')
        .single();
      if (sceneError) throw sceneError;

      const snapshots = activeMessages.map((message, position) => ({
        scene_id: scene.id,
        source_message_id: message.id,
        author_label: message.sender_id === user.id
          ? (profile?.display_name || 'You')
          : (otherUser?.display_name || 'Character'),
        author_kind: message.sender_id === user.id ? 'member' : 'character',
        content: message.content.trim(),
        position,
      }));
      const { error: snapshotError } = await supabase
        .from('roleplay_public_scene_messages')
        .insert(snapshots);
      if (snapshotError) {
        await supabase.from('roleplay_public_scenes').delete().eq('id', scene.id);
        throw snapshotError;
      }

      setShowPublishSceneModal(false);
      showToast(sceneVisibility === 'public' ? 'Scene published to CHIMERA Chats.' : 'Unlisted scene created. Only people with its link can read it.', 'success');
    } catch (error) {
      console.error('Failed to publish roleplay scene:', error);
      showToast('CHIMERA could not share this scene. Your private chat remains private.', 'error');
    } finally {
      setPublishingScene(false);
    }
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

  const isGroupAdmin = conversation?.type === 'group' && conversation?.created_by === user?.id;
  const canPublishScene = conversation?.type === 'dm' && conversation?.created_by === user?.id;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  // Determine chat style classes
  const getStyleClasses = () => {
    switch (aesthetics.chatStyle) {
      case 'crimson': return 'theme-crimson';
      case 'midnight': return 'theme-midnight';
      case 'royal': return 'theme-royal';
      case 'imessage': return 'theme-imessage';
      default: return '';
    }
  };

  const isPhoneLayout = aesthetics.layoutStyle === 'phone';
  const isModernLayout = aesthetics.layoutStyle === 'modern' || isPhoneLayout;

  return (
    <div className={`h-screen flex flex-col font-sans ${getStyleClasses()} ${isPhoneLayout ? 'bg-warm-100 dark:bg-black items-center justify-center p-0 sm:p-4' : 'bg-white dark:bg-warm-950'}`}>
      
      {/* Phone Wrapper & Touch Swipe Area */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full flex flex-col relative overflow-hidden bg-white dark:bg-warm-950 transition-all ${
        isPhoneLayout ? 'sm:max-w-[400px] sm:h-[850px] sm:max-h-[90vh] sm:rounded-[3rem] sm:border-[12px] sm:border-black sm:shadow-2xl sm:ring-1 sm:ring-warm-800' : ''
      }`}>

      {/* Dynamic Wallpaper */}
      {aesthetics.wallpaperUrl && (
        <div 
          className="fixed inset-0 z-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `url(${aesthetics.wallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        />
      )}
      
      {/* Header */}
      <header className={`flex-none sticky top-0 z-30 bg-white/90 dark:bg-warm-900/90 backdrop-blur-md border-b border-warm-200 dark:border-warm-800 ${isPhoneLayout ? 'sm:pt-8' : ''}`}>
        <div className={`max-w-7xl mx-auto px-4 py-3 flex items-center justify-between ${isPhoneLayout ? 'relative justify-center' : ''}`}>
          
          <div className={`flex items-center gap-3 flex-1 min-w-0 ${isPhoneLayout ? 'absolute left-4' : ''}`}>
            <button onClick={() => navigate('/conversations')} className="p-2 -ml-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500 transition-colors">
              <ArrowLeft size={24} />
            </button>
          </div>

          <div className={`flex items-center justify-center min-w-0 ${isPhoneLayout ? 'flex-col gap-1' : 'flex-1 gap-3 ml-3'}`}>
            {conversation?.type === 'dm' && otherUser && (
              <div 
                className={`flex items-center min-w-0 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-800/50 p-1 -ml-1 rounded-xl transition-colors ${isPhoneLayout ? 'flex-col gap-1' : 'gap-3'}`}
                onClick={() => setShowSettingsDrawer(true)}
              >
                <div className="relative group">
                  {/* Mood Halo Effect */}
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 opacity-70 blur-sm group-hover:opacity-100 transition-all animate-pulse pointer-events-none" />
                  <CharacterExpressionAvatar
                    defaultEmoji={otherUser.avatar_emoji}
                    defaultPhotoUrl={otherUser.photo_url}
                    expressions={characterExpressions}
                    lastMessageContent={messages[messages.length - 1]?.content}
                    size={isPhoneLayout ? "sm" : "md"}
                  />
                  {/* Voice Telepathy Stream Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-warm-900 flex items-center justify-center text-[8px] text-white font-bold shadow-md" title="Voice Telepathy Active">
                    🎙️
                  </div>
                </div>
                <div className={`min-w-0 ${isPhoneLayout ? 'text-center' : ''}`}>
                  <h1 className="font-serif font-bold text-lg text-warm-900 dark:text-warm-50 truncate flex items-center gap-1.5">
                    {otherUser.display_name}
                    <UserBadges badges={otherUser.badges} role={otherUser.role} size="sm" />
                    {otherUser.role === 'ai_character' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowMemoryModal(true); }}
                        className="text-warm-400 hover:text-primary-500 transition-colors p-1 rounded-md hover:bg-warm-100 dark:hover:bg-warm-800"
                        title="Memory"
                      >
                        <BookOpen size={16} />
                      </button>
                    )}
                  </h1>
                  <p className="text-xs text-warm-500">@{otherUser.username}</p>
                </div>
              </div>
            )}

            {conversation?.type === 'group' && (
              <div 
                className="min-w-0 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-800/50 p-1 -ml-1 rounded-xl transition-colors"
                onClick={() => setShowGroupSettings(true)}
              >
                <h1 className="font-serif font-bold text-lg text-warm-900 dark:text-warm-50 truncate">
                  {conversation.name || 'Group Chat'}
                </h1>
                <p className="text-xs text-warm-500">{participants.length} members</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {conversation?.type === 'dm' && (
              <>
                {/* Expressions Avatars Manager Button */}
                {otherUser?.role === 'ai_character' && (
                  <button 
                    onClick={() => setShowExpressionModal(true)}
                    className="p-2 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-1"
                    title="Manage Emotion Expression Avatars"
                  >
                    <Smile size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Expressions
                    </span>
                  </button>
                )}
                {/* Memory Nexus 2D Visualizer Button */}
                <button 
                  onClick={() => setShowMemoryVisualizer(true)}
                  className="p-2 rounded-xl hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors flex items-center gap-1"
                  title="Open Memory Nexus 2D Graph Visualizer"
                >
                  <Brain size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                    Nexus {memoryNexusState.recall_strength}
                  </span>
                </button>

                {/* Persona Switcher Pill (Rule 35) */}
                <button
                  onClick={() => setShowPersonaDrawer(true)}
                  className="p-2 rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Switch Active Persona (Rule 35)"
                >
                  <UserCheck size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    {activePersona ? activePersona.name : 'Persona'}
                  </span>
                </button>

                {/* World Relationship Network (Rule 34) */}
                <button
                  onClick={() => setShowWorldModal(true)}
                  className="p-2 rounded-xl hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Inspect World Relationship Network (Rule 34)"
                >
                  <Globe size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden xl:inline bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                    World
                  </span>
                </button>

                {/* Janitor AI Lorebook Inspector Button */}
                <button 
                  onClick={() => setShowLorebookDrawer(true)}
                  className="p-2 rounded-xl hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors flex items-center gap-1 relative"
                  title="Open Lorebook Inspector (Janitor AI Engine)"
                >
                  <BookOpen size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                    Lore ({loreTriggerResult.triggeredEntries.length})
                  </span>
                </button>

                <button 
                  onClick={() => setShowExporterModal(true)}
                  className="p-2 rounded-xl hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Roleplay Web Novel Exporter Studio"
                >
                  <BookOpen size={18} />
                  <span className="hidden sm:inline">Novel Studio</span>
                </button>

                {canPublishScene && (
                  <button
                    onClick={openPublishSceneModal}
                    className="p-2 rounded-xl text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
                    title="Share a deliberate snapshot of this roleplay"
                  >
                    <Share2 size={18} />
                    <span className="hidden xl:inline ml-1 text-[10px] font-bold uppercase tracking-wider">Share scene</span>
                  </button>
                )}

                {/* Multilingual AI Translation Button */}
                <button
                  onClick={() => setShowLangModal(true)}
                  className="p-2 rounded-xl hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Multilingual AI Chat Translation"
                >
                  <Globe size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    {targetLang.toUpperCase()}
                  </span>
                </button>
                <button className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500 transition-colors">
                  <Paperclip size={20} />
                </button>
                <button 
                  onClick={handleRequestImage}
                  disabled={requestingImage}
                  className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${requestingImage ? 'text-primary-500 animate-pulse' : 'hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500'}`}
                  title="Request image or selfie"
                >
                  <Camera size={20} />
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">FREE</span>
                </button>
                <button 
                  onClick={voice.toggleVoice} 
                  className={`p-2 rounded-xl transition-colors ${voice.isEnabled ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500'}`}
                  title="Toggle Voice TTS"
                >
                  <AudioWaveform size={20} />
                </button>
                <button 
                  onClick={() => setIsPhoneOpen(true)}
                  className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500 transition-colors"
                  title="Open Phone Modal"
                >
                  <Phone size={20} />
                </button>
              </>
            )}
            {conversation?.type === 'group' && (
              <button onClick={() => setShowGroupSettings(true)} className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500 transition-colors">
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Mode Switcher Bar */}
        <div className="bg-warm-50 dark:bg-warm-900 px-4 py-1.5 border-t border-warm-200/50 dark:border-warm-800/50 flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            {[
              { id: 'one_on_one', label: '1-on-1 RP', icon: Users },
              { id: 'group_chat', label: 'Group Chat', icon: Users },
              { id: 'story_mode', label: 'Story Mode', icon: BookOpen },
              { id: 'game_mode', label: 'RPG Game Mode', icon: Gamepad2 },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = chatMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setChatMode(m.id as ChatMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-warm-600 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-800'
                  }`}
                >
                  <Icon size={12} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-warm-500 dark:text-warm-400 font-medium">
            <span>Recall: <strong className="text-purple-500 font-bold">{memoryNexusState.recall_strength}/16</strong></span>
            <span>Memories: <strong className="text-purple-500 font-bold">{memoryNexusState.nodes.length}</strong></span>
          </div>
        </div>
      </header>

      {/* Settings Drawer */}
      {otherUser && (
        <ChatSettingsDrawer
          isOpen={showSettingsDrawer}
          onClose={() => setShowSettingsDrawer(false)}
          character={otherUser}
          user={user}
          isVoiceEnabled={voice.isEnabled}
          onToggleVoice={voice.toggleVoice}
          onSelectPersona={() => navigate('/personas')}
          onOpenMemory={() => setShowMemoryModal(true)}
          onOpenMemoryVisualizer={() => setShowMemoryVisualizer(true)}
          recallStrength={memoryNexusState.recall_strength}
          onChangeRecallStrength={(val) => setMemoryNexusState((prev) => ({ ...prev, recall_strength: val }))}
          aesthetics={aesthetics}
        />
      )}

      {/* Memory Nexus 2D Graph Visualizer Modal */}
      <MemoryVisualizerModal
        isOpen={showMemoryVisualizer}
        onClose={() => setShowMemoryVisualizer(false)}
        memoryNexusState={memoryNexusState}
        onUpdateState={setMemoryNexusState}
      />

      {/* Janitor AI Lorebook Drawer & Inspector */}
      <LorebookDrawer
        isOpen={showLorebookDrawer}
        onClose={() => setShowLorebookDrawer(false)}
        entries={lorebookEntries}
        matchedKeywordsMap={loreTriggerResult.matchedKeywordsMap}
        onToggleForceActive={(entryId, forceActive) => {
          setLorebookEntries((prev) =>
            prev.map((e) => (e.id === entryId ? { ...e, force_active: forceActive } : e))
          );
        }}
        onAddEntry={async (newEntry) => {
          const created: LorebookEntry = {
            id: `lb-${Date.now()}`,
            lorebook_id: 'default',
            title: newEntry.title,
            content: newEntry.content,
            keywords: newEntry.keywords,
            priority: 10,
            enabled: true,
            insertion_order: lorebookEntries.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setLorebookEntries((prev) => [...prev, created]);
          showToast(`Added Lorebook Entry: ${newEntry.title}`, 'success');
        }}
        onImportJson={async (jsonString) => {
          const parsed = parseJanitorLorebookJson(jsonString);
          const newEntries: LorebookEntry[] = parsed.entries.map((e, idx) => ({
            id: `imported-${Date.now()}-${idx}`,
            lorebook_id: 'imported',
            title: e.title || `Entry ${idx + 1}`,
            content: e.content || '',
            keywords: e.keywords || [],
            selective_keys: e.selective_keys || [],
            is_constant: e.is_constant || false,
            priority: e.priority || 10,
            enabled: true,
            insertion_order: lorebookEntries.length + idx,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          setLorebookEntries((prev) => [...prev, ...newEntries]);
          showToast(`Imported Lorebook "${parsed.title}" with ${newEntries.length} entries!`, 'success');
        }}
        scanDepth={scanDepth}
        onChangeScanDepth={setScanDepth}
      />

      {/* Memory Modal */}
      {otherUser && (
        <ChatMemoryModal 
          isOpen={showMemoryModal} 
          onClose={() => setShowMemoryModal(false)} 
          character={otherUser} 
          conversationId={conversationId}
        />
      )}

      {/* Mock Phone Modal */}
      <MockPhoneModal
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        messages={messages}
        onSendMessage={handlePhoneSendMessage}
        otherUser={otherUser}
        currentUser={profile}
      />

      {/* Main Layout Area */}
      <div className="flex-1 overflow-hidden w-full max-w-7xl mx-auto flex relative">
        
        {/* Chat Column */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Multi-Character Participant Header Bar */}
          {(chatMode === 'group_chat' || chatMode === 'story_mode' || multiParticipants.length > 1) && (
            <MultiCharacterHeader
              participants={multiParticipants}
              activeSpeakerId={activeSpeakerId}
              onSelectActiveSpeaker={(id) => {
                setActiveSpeakerId(id);
                setMultiParticipants((prev) =>
                  prev.map((p) => ({ ...p, is_active_speaker: p.character_id === id }))
                );
              }}
              onTriggerAiSpeaker={async () => {
                const speakerId = activeSpeakerId || multiParticipants[0]?.character_id;
                if (!speakerId || !conversationId) return;

                showToast('Triggering character response...', 'info');
                setTypingUsers([speakerId]);

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
                    bot_user_id: speakerId
                  })
                }).catch(err => {
                  console.error('Error triggering AI speaker:', err);
                  setTypingUsers([]);
                });
              }}
              onAddCharacter={() => setShowAddCharModal(true)}
              onRemoveCharacter={(id) => {
                setMultiParticipants((prev) => prev.filter((p) => p.character_id !== id));
                showToast('Character removed from scene', 'info');
              }}
            />
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scroll-smooth">
            {conversation?.type === 'dm' && otherUser?.role === 'ai_character' && (
              <section className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 px-4 py-3">
                <button onClick={() => setShowSceneCanon(v => !v)} className="w-full flex items-center justify-between gap-3 text-left">
                  <span className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-200"><Brain size={15} /> This scene remembers</span>
                  <span className="text-[11px] text-warm-500">{showSceneCanon ? 'Close' : 'View & edit'}</span>
                </button>
                {!showSceneCanon && sceneCanon && <p className="mt-2 text-xs leading-relaxed text-warm-600 dark:text-warm-300 line-clamp-2">{sceneCanon.replace(/^•\s*/gm, '• ')}</p>}
                {showSceneCanon && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-warm-500">Facts, scene rules, tone, promises, and writing preferences the character should quietly honor.</p>
                    <textarea value={sceneCanonDraft} onChange={(e) => setSceneCanonDraft(e.target.value)} placeholder="• Paris, in the rain\n• Keep the tone slow and romantic\n• He never uses that nickname" rows={6} className="w-full rounded-xl border border-warm-200 dark:border-warm-700 bg-white/80 dark:bg-warm-950/40 p-3 text-sm text-warm-800 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                    <div className="flex justify-end gap-2"><button onClick={() => { setSceneCanonDraft(sceneCanon); setShowSceneCanon(false); }} className="text-xs font-bold text-warm-500 px-3 py-2">Cancel</button><button onClick={saveSceneCanon} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white">Save scene</button></div>
                  </div>
                )}
              </section>
            )}
            
            {/* Guided paths are optional; ordinary roleplay remains fully freeform. */}
            {chatMode === 'game_mode' && conversation?.type === 'dm' && otherUser?.role === 'ai_character' && (
              <GuidedTurningPointCard point={turningPoint} loading={turningPointLoading} onOpen={openTurningPoint} onChoose={chooseTurningPoint} />
            )}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-warm-500 space-y-3">
                <BookOpen size={32} className="opacity-20" />
                <p className="font-serif italic text-lg opacity-60">The story begins...</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const sender: any = message.profiles || (isOwn ? profile : otherUser);
                const isAI = sender?.role === 'ai_character';

                return (
                  <div 
                    key={message.id} 
                    className={`group relative flex gap-4 p-2 sm:p-4 rounded-2xl transition-colors
                      ${isModernLayout && isOwn ? 'flex-row-reverse -mr-2 sm:-mr-4' : '-mx-2 sm:-mx-4'}
                      ${isModernLayout && isOwn ? '' : 'hover:bg-warm-50 dark:hover:bg-warm-900/30'}
                    `}
                  >
                    {/* Avatar Column */}
                    {!(isModernLayout && isOwn) && (
                      <div className="flex-shrink-0 mt-1">
                        <Avatar emoji={sender?.avatar_emoji || '?'} photoUrl={sender?.photo_url || null} size="md" />
                      </div>
                    )}

                    {/* Content Column */}
                    <div className={`flex-1 min-w-0 space-y-1.5 ${isModernLayout && isOwn ? 'flex flex-col items-end' : ''}`}>
                      {!(isModernLayout && isOwn) && (
                        <div className="flex items-baseline gap-2">
                          <span className={`font-bold ${isOwn ? 'text-warm-900 dark:text-warm-100' : 'text-primary-600 dark:text-primary-400'}`}>
                            {sender?.display_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-warm-400 dark:text-warm-600 font-medium">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
                          </span>
                        </div>
                      )}

                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Shared image"
                          className="rounded-xl max-w-sm w-full mb-3 cursor-pointer border border-warm-200 dark:border-warm-800 shadow-sm"
                          onClick={() => window.open(message.image_url!, '_blank')}
                        />
                      )}

                      {message.content && message.content !== 'Sent an image' && (
                        <div className={`text-[15px] sm:text-base leading-relaxed text-warm-800 dark:text-warm-200 whitespace-pre-wrap font-serif
                          ${isModernLayout ? `px-4 py-2.5 rounded-2xl max-w-[85%] ${
                            isOwn 
                              ? (aesthetics.chatStyle === 'imessage' ? 'bg-[#007AFF] text-white rounded-tr-sm' : 'bg-primary-600 text-white rounded-tr-sm') 
                              : (aesthetics.chatStyle === 'imessage' ? 'bg-[#E5E5EA] text-black dark:bg-[#262628] dark:text-white rounded-tl-sm' : 'bg-warm-100 dark:bg-warm-900 rounded-tl-sm')
                          }` : ''}
                        `}>
                          {editingMessageId === message.id ? (
                            <div className="mt-1 flex flex-col gap-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-white dark:bg-warm-900 border border-warm-300 dark:border-warm-700 rounded-lg p-2 text-sm focus:outline-none focus:border-red-500 min-h-[80px]"
                              />
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditingMessageId(null)}
                                  className="text-xs px-3 py-1.5 rounded-md hover:bg-warm-200 dark:hover:bg-warm-800 text-warm-600 dark:text-warm-300 transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={handleSaveEdit}
                                  className="text-xs px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>
                      )}

                      {/* Swiping Toolbar & Branching Controls */}
                      {isAI && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-warm-400">
                          <div className="flex items-center gap-1 bg-warm-900/60 px-2 py-0.5 rounded-lg border border-warm-800">
                            <button
                              onClick={() => handleSwipeChange(message.id, 'left')}
                              className="p-1 hover:text-white transition-colors font-bold"
                              title="Previous response variation"
                            >
                              ◀
                            </button>
                            <span className="font-mono text-[11px] font-bold text-warm-200 px-1">
                              {(swipesMap[message.id]?.currentIndex ?? 0) + 1} / {swipesMap[message.id]?.variations.length || 1}
                            </span>
                            <button
                              onClick={() => handleSwipeChange(message.id, 'right')}
                              className="p-1 hover:text-white transition-colors font-bold"
                              title="Next response variation"
                            >
                              ▶
                            </button>
                          </div>

                          <button
                            onClick={() => handleSwipeNew(message.id)}
                            className="p-1 px-2 rounded-lg bg-warm-800/60 hover:bg-warm-750 text-warm-300 hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px] border border-warm-700/50"
                            title="Generate new swipe variation"
                          >
                            <RotateCw size={11} />
                            <span>Swipe New</span>
                          </button>

                          {/* Character.ai Audio Voice Playback Speaker */}
                          <button
                            onClick={() => {
                              if (speakingMessageId === message.id) {
                                voiceEngine.stop();
                                setSpeakingMessageId(null);
                              } else {
                                setSpeakingMessageId(message.id);
                                voiceEngine.speak(message.content, (sender as any)?.voice_id, () => {
                                  setSpeakingMessageId(null);
                                });
                              }
                            }}
                            className={`p-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all border ${
                              speakingMessageId === message.id
                                ? 'bg-purple-600 text-white border-purple-400 shadow-md animate-pulse'
                                : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white border-purple-800/40'
                            }`}
                            title="Play character voice audio (Character.ai style)"
                          >
                            <Volume2 size={13} className={speakingMessageId === message.id ? 'animate-bounce' : ''} />
                            <span>{speakingMessageId === message.id ? 'Stop Voice' : 'Listen Voice'}</span>
                          </button>

                          <button
                            onClick={() => handleBranchFromMessage(message.id)}
                            className="p-1 px-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px] border border-purple-800/40"
                            title="Branch conversation from here"
                          >
                            <Brain size={11} />
                            <span>Branch</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-warm-800/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-warm-200 dark:border-warm-700 shadow-sm">
                      <button
                        onClick={() => togglePinMessage(message.id)}
                        className={`p-1.5 rounded-md transition-colors ${pinnedMessageIds.includes(message.id) ? 'text-amber-500 bg-amber-500/10' : 'text-warm-500 hover:text-amber-500 hover:bg-warm-100 dark:hover:bg-warm-700'}`}
                        title={pinnedMessageIds.includes(message.id) ? 'Unpin message from memory' : 'Pin message to permanent memory'}
                      >
                        📌
                      </button>
                      <button 
                        className="p-1.5 text-warm-500 hover:text-warm-900 dark:hover:text-white rounded-md hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                        title="Copy message"
                        onClick={() => navigator.clipboard.writeText(message.content || '')}
                      >
                        <Copy size={14} />
                      </button>
                      
                      {isOwn && (
                        <>
                          <button 
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditContent(message.content || '');
                            }}
                            className="p-1.5 text-warm-500 hover:text-warm-900 dark:hover:text-white rounded-md hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                            title="Edit message"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1.5 text-warm-500 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}

                      {isAI && (
                        <>
                          <button
                            onClick={async () => {
                              showToast('🎙️ Generating ElevenLabs Voice Audio...', 'info');
                              try {
                                const audioUrl = await generateElevenLabsAudio(message.content || '');
                                const audio = new Audio(audioUrl);
                                audio.play();
                              } catch (err) {
                                console.warn('ElevenLabs API error, falling back to Web Speech API:', err);
                                if ('speechSynthesis' in window) {
                                  window.speechSynthesis.cancel();
                                  const utt = new SpeechSynthesisUtterance(message.content || '');
                                  window.speechSynthesis.speak(utt);
                                }
                              }
                            }}
                            className="p-1.5 text-warm-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            title="Play ElevenLabs Ultra-HD Voice"
                          >
                            <Volume2 size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditContent(message.content || '');
                            }}
                            className="p-1.5 text-warm-500 hover:text-warm-900 dark:hover:text-white rounded-md hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
                            title="Edit AI message"
                          >
                            <Edit3 size={14} />
                          </button>
                          {index === messages.length - 1 && (
                            <button 
                              onClick={() => handleRegenerateMessage(message.id)}
                              className="p-1.5 text-warm-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                              title="Regenerate response"
                            >
                              <RotateCw size={14} />
                            </button>
                          )}
                        </>
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
            <span className="text-xs text-warm-500 font-medium">{getTypingDisplay()}</span>
          </div>
        )}

        {/* Roleplay Safety Intervention System Card */}
        {isRoleplayPaused && (
          <RoleplaySafetyPauseCard
            onEditPreviousMessage={() => {
              const lastUserMsg = [...messages].reverse().find(m => m.sender_id === user?.id);
              if (lastUserMsg) {
                setEditingMessageId(lastUserMsg.id);
                setEditContent(lastUserMsg.content || '');
              }
              setIsRoleplayPaused(false);
            }}
            onSendNewMessage={() => {
              setIsRoleplayPaused(false);
              msgInputRef.current?.focus();
            }}
            onReportError={() => {
              showToast('Report submitted. Thank you for helping keep CHIMERA safe.', 'info');
              setIsRoleplayPaused(false);
            }}
          />
        )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="px-4 pb-2">
              <div className="relative inline-block border border-warm-200 dark:border-warm-700 rounded-xl p-1 bg-white dark:bg-warm-800 shadow-sm">
                <img src={imagePreview} alt="Preview" className="h-24 rounded-lg object-cover" />
                <button
                  onClick={clearImage}
                  className="absolute -top-3 -right-3 bg-warm-900 dark:bg-white text-white dark:text-warm-900 rounded-full p-1.5 shadow-md hover:scale-110 transition-transform"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Message Input Area */}
          <div className="flex-none p-4 sm:p-6 bg-white dark:bg-warm-950 border-t border-warm-100 dark:border-warm-800/50">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
              
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-4 left-0 animate-scale-in z-50 shadow-2xl rounded-2xl border border-warm-200 dark:border-warm-700">
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

              <div className="flex items-end gap-3 bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-700 rounded-3xl p-2 shadow-sm focus-within:border-red-400 dark:focus-within:border-red-600 focus-within:ring-4 focus-within:ring-red-500/10 transition-all">
                
                {/* Studio Action Bar Pills (+ Narrate, Actions, Thoughts, OOC) */}
                <div className="flex items-center gap-2 px-3 pt-2.5 overflow-x-auto text-xs font-bold border-b border-warm-800/40 pb-2 scrollbar-none select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setMessageInput(prev => `*narrates scene details* ${prev}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>+ Narrate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessageInput(prev => `*takes action* ${prev}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>🪄 Actions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessageInput(prev => `(thinks silently: ${prev})`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>💭 Thoughts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOocMode(p => !p)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 ${
                      isOocMode
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-warm-800/80 hover:bg-warm-750 text-warm-300 border border-warm-700/60'
                    }`}
                  >
                    <span>💬 OOC</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-warm-400 hover:text-white hover:bg-warm-800 transition-colors"
                    disabled={sending}
                    title="Attach image"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <textarea
                    ref={msgInputRef}
                    value={messageInput}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                    placeholder={isOocMode ? "Out of Character (OOC) mode: Talk to the AI author or instruct lore updates..." : "Write your message..."}
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-1.5 text-sm sm:text-base text-white placeholder:text-warm-500 font-serif leading-relaxed"
                    style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
                    maxLength={MSG_LIMIT}
                    disabled={sending}
                    rows={1}
                  />

                  {/* Gold Metallic Send Feather Button */}
                  <button
                    type="submit"
                    disabled={sending || (!messageInput.trim() && !imageFile)}
                    className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-warm-950 font-bold rounded-2xl p-3 flex items-center justify-center disabled:opacity-40 transition-all shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                    title="Send message"
                  >
                    {sending || uploadingImage ? (
                      <Loader2 size={18} className="animate-spin text-warm-950" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
              
              {messageInput.length > MSG_LIMIT * 0.85 && (
                <p className={`absolute -bottom-5 right-4 text-[10px] font-medium tracking-wide ${messageInput.length > MSG_LIMIT ? 'text-red-500' : 'text-warm-400'}`}>
                  {messageInput.length} / {MSG_LIMIT}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right Sidebar: Context Drawer */}
        {showContextDrawer && conversation?.type === 'dm' && otherUser && (
          <div className="hidden md:flex flex-col w-80 flex-shrink-0 bg-warm-50 dark:bg-warm-900 border-l border-warm-200 dark:border-warm-800 overflow-y-auto animate-fade-in">
            <div className="p-6 space-y-6">
              {/* Character Profile Summary */}
              <div className="text-center space-y-3">
                <Avatar emoji={otherUser.avatar_emoji} photoUrl={otherUser.photo_url} size="xl" />
                <div>
                  <h2 className="font-serif font-bold text-xl text-warm-900 dark:text-warm-50">{otherUser.display_name}</h2>
                  <p className="text-sm text-warm-500">@{otherUser.username}</p>
                </div>
              </div>

              <hr className="border-warm-200 dark:border-warm-800" />

              {/* Memory / Lore Section Placeholder & Live SillyTavern Lore Trigger Inspector */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-warm-900 dark:text-warm-100 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={14} className="text-amber-500" /> Triggered Lore &amp; Context
                </h3>

                {loreTriggerResult.triggeredEntries.length === 0 ? (
                  <p className="text-xs text-warm-500 leading-relaxed bg-white dark:bg-warm-800 p-3.5 rounded-xl border border-warm-200 dark:border-warm-700 italic">
                    No lorebook entries triggered yet. Mention keywords from your world or persona lorebooks to inject them into chat context.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {loreTriggerResult.triggeredEntries.map((entry) => {
                      const matches = loreTriggerResult.matchedKeywordsMap[entry.id] || [];
                      return (
                        <div key={entry.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="truncate">{entry.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                              Order: {entry.insertion_order}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-80 line-clamp-2">{entry.content}</p>
                          {matches.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-1">
                              <span className="text-[10px] opacity-60">Matched:</span>
                              {matches.map((m, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-200 font-mono">
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <hr className="border-warm-800" />

              {/* Model Settings & Sliders Inspector (Matching Mockup) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-warm-400 uppercase tracking-wider">Model Settings</h3>
                  <button onClick={() => setShowSettingsDrawer(true)} className="text-[11px] text-amber-400 font-bold hover:underline">
                    Advanced Settings ›
                  </button>
                </div>

                {/* Model Dropdown */}
                <div className="space-y-1">
                  <label className="text-[11px] text-warm-400 font-bold">Model</label>
                  <select
                    className="w-full bg-warm-950 border border-warm-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="chimera-1.5">⚡ Chimera-1.5 (Default)</option>
                    <option value="chimera-2.0-pro">✨ Chimera-2.0 Pro</option>
                    <option value="claude-3-5-sonnet">🎭 Claude 3.5 Sonnet</option>
                  </select>
                </div>

                {/* Context Window Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-warm-400">Context Window</span>
                    <span className="text-white font-mono">32K</span>
                  </div>
                  <input
                    type="range"
                    min="4000"
                    max="64000"
                    step="4000"
                    defaultValue="32000"
                    className="w-full accent-amber-500 bg-warm-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Temperature Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-warm-400">Temperature</span>
                    <span className="text-amber-400 font-mono">0.78</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.02"
                    defaultValue="0.78"
                    className="w-full accent-amber-500 bg-warm-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Response Style Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-warm-400">Response Style</span>
                    <span className="text-purple-300 font-bold">Balanced</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    defaultValue="2"
                    className="w-full accent-purple-500 bg-warm-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-warm-500 font-bold pt-0.5">
                    <span>Concise</span>
                    <span>Balanced</span>
                    <span>Descriptive</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deliberate public-scene snapshot modal. This never changes the private conversation itself. */}
      {showPublishSceneModal && canPublishScene && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="share-scene-title">
          <div className="w-full max-w-lg rounded-t-3xl border border-warm-200 bg-white p-6 shadow-2xl dark:border-warm-700 dark:bg-warm-900 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Private by default</p>
                <h2 id="share-scene-title" className="mt-1 font-serif text-2xl font-bold text-warm-900 dark:text-white">Share a scene, not your live chat</h2>
              </div>
              <button onClick={() => setShowPublishSceneModal(false)} className="rounded-xl p-2 text-warm-500 transition hover:bg-warm-100 dark:hover:bg-warm-800" aria-label="Close share scene dialog"><X size={20} /></button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-warm-600 dark:text-warm-300">CHIMERA will make a separate snapshot of the messages currently in this roleplay. Future messages, edits, and private notes remain private.</p>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-warm-800 dark:text-warm-100">Scene title
                <input value={sceneTitle} onChange={(event) => setSceneTitle(event.target.value)} maxLength={140} className="mt-2 w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 outline-none transition focus:border-emerald-500 dark:border-warm-700 dark:bg-warm-800 dark:text-white" placeholder="The title readers will see" />
              </label>
              <label className="block text-sm font-bold text-warm-800 dark:text-warm-100">A short note <span className="font-normal text-warm-500">(optional)</span>
                <textarea value={sceneSummary} onChange={(event) => setSceneSummary(event.target.value)} maxLength={600} rows={3} className="mt-2 w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 outline-none transition focus:border-emerald-500 dark:border-warm-700 dark:bg-warm-800 dark:text-white" placeholder="Give readers a little context without revealing more than you mean to." />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl border border-warm-200 p-3 dark:border-warm-700">
                  <span className="block text-xs font-bold uppercase tracking-wide text-warm-500">Visibility</span>
                  <select value={sceneVisibility} onChange={(event) => setSceneVisibility(event.target.value as 'unlisted' | 'public')} className="mt-2 w-full bg-transparent text-sm font-bold text-warm-900 outline-none dark:text-white">
                    <option value="unlisted">Unlisted — link only</option>
                    <option value="public">Public — CHIMERA Chats</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-warm-200 p-3 dark:border-warm-700">
                  <span className="block text-xs font-bold uppercase tracking-wide text-warm-500">Content rating</span>
                  <select value={sceneRating} onChange={(event) => setSceneRating(event.target.value as 'limited' | 'mature')} className="mt-2 w-full bg-transparent text-sm font-bold text-warm-900 outline-none dark:text-white">
                    <option value="limited">Limited</option>
                    <option value="mature">Mature</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setShowPublishSceneModal(false)} disabled={publishingScene} className="rounded-xl px-4 py-2.5 text-sm font-bold text-warm-600 transition hover:bg-warm-100 disabled:opacity-50 dark:text-warm-300 dark:hover:bg-warm-800">Keep it private</button>
              <button onClick={handlePublishScene} disabled={publishingScene} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                {publishingScene ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} {sceneVisibility === 'public' ? 'Publish scene' : 'Create unlisted scene'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* In-Chat Persona Switcher Drawer */}
      <InChatPersonaDrawer
        isOpen={showPersonaDrawer}
        onClose={() => setShowPersonaDrawer(false)}
        activePersonaId={activePersona?.id}
        onSelectPersona={(p) => setActivePersona(p)}
      />

      {/* Character Expression Manager Modal */}
      <CharacterExpressionManagerModal
        isOpen={showExpressionModal}
        onClose={() => setShowExpressionModal(false)}
        characterName={otherUser?.display_name || 'AI Character'}
        expressions={characterExpressions}
        onSaveExpressions={(updated) => setCharacterExpressions(updated)}
      />

      {/* World Relationship Network Modal */}
      <WorldRelationshipModal
        isOpen={showWorldModal}
        onClose={() => setShowWorldModal(false)}
        worldName={otherUser?.display_name ? `${otherUser.display_name}'s Realm` : 'Eldoria Nexus'}
      />

      {/* Roleplay Web Novel Exporter Studio */}
      <TranscriptsExporterModal
        isOpen={showExporterModal}
        onClose={() => setShowExporterModal(false)}
        characterName={otherUser?.display_name || 'AI Character'}
        characterAvatarUrl={otherUser?.photo_url || undefined}
        messages={messages}
        conversationTitle={conversation?.name || `Chronicle of ${otherUser?.display_name || 'Hero'}`}
      />

      {/* Multilingual AI Translation Modal */}
      <LanguageSelectorModal
        isOpen={showLangModal}
        onClose={() => setShowLangModal(false)}
        currentLanguage={targetLang}
        onSelectLanguage={(lang) => setTargetLang(lang)}
      />

      {/* Add AI Character to Group Room Modal */}
      <AddCharacterToGroupModal
        isOpen={showAddCharModal}
        onClose={() => setShowAddCharModal(false)}
        existingIds={multiParticipants.map(p => p.character_id)}
        onSelectCharacter={(char) => {
          setMultiParticipants(prev => [
            ...prev,
            {
              character_id: char.id,
              display_name: char.display_name,
              avatar_emoji: char.avatar_emoji || '🎭',
              photo_url: char.photo_url || undefined,
              is_active_speaker: false,
              role: 'ai_character'
            }
          ]);
          showToast(`Invited ${char.display_name} to the group scene!`, 'success');
        }}
      />

      {/* End Phone Wrapper */}
      </div>

    </div>
  );
}
