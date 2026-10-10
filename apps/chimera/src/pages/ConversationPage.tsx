import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, Globe, Palette, Check, Copy, Flag, GitBranch, History, Info, Loader2, Pencil, Pin, RefreshCw, Send, SlidersHorizontal, ThumbsDown, ThumbsUp, Trash2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { isAdultRating, useAdultContentAccess } from '../hooks/useAdultContentAccess';
import { ConfirmDialog, MessageMenu, type Anchor, type MenuItem } from '../components/chat/MessageMenu';
import { MessageRow } from '../components/chat/MessageRow';
import { ManagementPanel, type PanelTab } from '../components/chat/ManagementPanel';
import { AboutSection } from '../components/chat/panel/AboutSection';
import { HistorySection } from '../components/chat/panel/HistorySection';
import { PersonaSection } from '../components/chat/panel/PersonaSection';
import { LorebookSection } from '../components/chat/panel/LorebookSection';
import { LookSection } from '../components/chat/panel/LookSection';
import { UniverseSection } from '../components/chat/panel/UniverseSection';
import { MemoryNatureEditor, MemoryNatureFields, MemoryTags } from '../components/chat/panel/MemoryNature';
import { canBeEverywhere, type KnownBy, type MemoryCertainty } from '../lib/memoryCertainty';
import { useChatLook } from '../hooks/useChatLook';
import { useWallpaper } from '../hooks/useWallpaper';
import { WallpaperLayer } from '../components/chat/WallpaperLayer';
import { lookAttributes } from '../lib/chatLook';
import { scrollBehavior } from '../lib/motion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { readPanelOpen, writePanelOpen } from '../lib/panelPrefs';
import { ReportDialog } from '../components/chat/ReportDialog';
import { FEEDBACK_LIVE, MODERATION_LIVE, submitMessageReport } from '../lib/moderation';
import { loadMyFeedback, setMessageFeedback, type Rating } from '../lib/messageFeedback';
import { copyText } from '../lib/clipboard';
import { plainText } from '../lib/richText';
import {
  MESSAGE_EDIT_LIMITS,
  formatPlayerLine,
  persistPlayerMessage,
  requestCharacterReply,
  requestTurningPoint,
  type ChatMessageRow,
  type ComposerMode,
} from '../lib/chat';
import { GuidedTurningPointCard, type GuidedTurningPoint } from '../components/GuidedTurningPointCard';
import { createPendingPlayerSends, PendingPlayerSendError } from '../lib/pendingPlayerSend';
import { loadMyPersonas, type PersonaSummary } from '../lib/personas';
import { cleanOpenings, surpriseOpening } from '../lib/openings';
import { ADULT_CONFIRMATION_LIVE, AGE_VERIFICATION_LIVE } from '../lib/ageVerification';
import {
  MAX_MEMORIES,
  MEMORY_LIMITS,
  MEMORY_TYPES,
  addMemory,
  approveMemory,
  countEveryChatMemories,
  deleteMemory,
  editMemory,
  loadMemories,
  memoryTypeLabel,
  requestMemorySuggestions,
  setMemoryNature,
  setMemoryScope,
  type MemoryTypeId,
  type SceneMemory,
} from '../lib/memories';
import {
  DEFAULT_SCENE_SETTINGS,
  RESPONSE_LENGTHS,
  SCENE_LIMITS,
  deleteScene,
  loadSceneSettings,
  renameScene,
  saveSceneSettings,
  startOverScene,
  togglePin,
  type SceneSettings,
} from '../lib/sceneSettings';

interface SceneInfo {
  botUserId: string;
  /** The character's own id (not the user id), used to find its memories. */
  characterId: string;
  botName: string;
  /** The player's own title for this scene, if they set one. */
  title: string | null;
  greeting: string | null;
  /** The scene is the player's own, so they may also edit and delete the character's messages in it. */
  createdByMe: boolean;
  /** The player made this character, so they may link lorebooks to it. */
  characterMine: boolean;
  /** Every way this character can open a scene: its main opening first. More than one means the player picks. */
  openings: string[];
  rating: string | null;
  canon: string;
  canonRevision: number;
}

type PanelTabId = 'about' | 'chat' | 'history' | 'world' | 'universe' | 'memory' | 'persona' | 'look';

const MODES: Array<{ id: ComposerMode; label: string; hint: string }> = [
  { id: 'say', label: 'Say', hint: 'Speak as your character' },
  { id: 'act', label: 'Act', hint: 'Describe what your character does' },
  { id: 'ooc', label: 'OOC', hint: 'Talk outside the story' },
];

// A turning point needs enough story behind it; the server checks this too.
const TURNING_POINT_MIN_MESSAGES = 8;

export default function ConversationPage() {
  const openingBusyRef = useRef(false);
  const [openingBusy, setOpeningBusy] = useState(false);
  const [menu, setMenu] = useState<{ messageId: string; anchor: Anchor } | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string; saving: boolean; problem: string | null } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; busy: boolean } | null>(null);
  const [branchingId, setBranchingId] = useState<string | null>(null);
  const [reporting, setReporting] = useState<{ id: string; speaker: string } | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Rating>>({});
  const feedbackLoadedRef = useRef<Set<string>>(new Set());
  // True from the moment a message is being sent until the character's answer has been asked for.
  const [replyPending, setReplyPending] = useState(false);
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { allowed: adultAccess, loading: accessLoading } = useAdultContentAccess();

  const [scene, setScene] = useState<SceneInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<ComposerMode>('say');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const { look, change: changeLook, reset: resetLook, saved: lookSaved } = useChatLook();
  const wallpaper = useWallpaper();
  const [panelTab, setPanelTab] = useState<PanelTabId>('chat');
  const [historyKey, setHistoryKey] = useState(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // True when the player has just opened the panel (not when it came back open from the last visit): only then does it take the keyboard focus.
  const [focusPanel, setFocusPanel] = useState(false);
  const [canonDraft, setCanonDraft] = useState('');
  const [savingCanon, setSavingCanon] = useState(false);
  const [turningPoint, setTurningPoint] = useState<GuidedTurningPoint | null>(null);
  const [turningPointLoading, setTurningPointLoading] = useState(false);
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [personaSelected, setPersonaSelected] = useState(false);
  // On a computer the panel stays open next to the chat if it was left open; on a phone it always starts closed.
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 1024px)').matches && readPanelOpen());
  const [settings, setSettings] = useState<SceneSettings>(DEFAULT_SCENE_SETTINGS);
  // False when the saved settings could not be read: the controls lock so they cannot overwrite them with defaults.
  const [settingsReady, setSettingsReady] = useState(true);
  const settingsRef = useRef<SceneSettings>(DEFAULT_SCENE_SETTINGS);
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve());
  const pendingSavesRef = useRef(0);
  const failedSaveRef = useRef(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [bannedDraft, setBannedDraft] = useState('');
  const [toolsBusy, setToolsBusy] = useState(false);
  const [confirming, setConfirming] = useState<'restart' | 'delete' | null>(null);
  const [keepMemory, setKeepMemory] = useState(true);
  const [memories, setMemories] = useState<SceneMemory[]>([]);
  const [memoriesFailed, setMemoriesFailed] = useState(false);
  const [editingMemory, setEditingMemory] = useState<{ id: string; text: string } | null>(null);
  const [memoryBusy, setMemoryBusy] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState<{ text: string; type: MemoryTypeId; everywhere: boolean; certainty: MemoryCertainty; knownBy: KnownBy }>({ text: '', type: 'long_term', everywhere: false, certainty: 'canon', knownBy: 'character' });
  const suggestingRef = useRef(false);
  const busyRef = useRef(false);
  const pendingSendsRef = useRef<ReturnType<typeof createPendingPlayerSends> | null>(null);
  if (!pendingSendsRef.current) pendingSendsRef.current = createPendingPlayerSends();
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (): Promise<ChatMessageRow[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, response_versions')
      .eq('conversation_id', conversationId!)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as ChatMessageRow[];
    setMessages(rows);
    return rows;
  }, [conversationId]);

  const memoryContextRef = useRef<{ characterId: string; personaId: string | null } | null>(null);

  const refreshMemories = useCallback(async () => {
    const context = memoryContextRef.current;
    if (!context || !conversationId) return;
    try {
      setMemories(await loadMemories(conversationId, context.characterId, context.personaId));
      setMemoriesFailed(false);
    } catch {
      setMemoriesFailed(true);
    }
  }, [conversationId]);

  // Every few messages the story may suggest things to remember. The server decides whether there is
  // anything to look at, so this call is cheap; suggestions only count once the player approves them.
  const maybeSuggestMemories = useCallback(
    async (rows: ChatMessageRow[], botUserId: string) => {
      const mine = rows.filter((m) => m.sender_id === userId).length;
      if (!conversationId || suggestingRef.current || mine < 8 || mine % 4 !== 0 || !settingsRef.current.autoMemory) return;
      suggestingRef.current = true;
      try {
        if ((await requestMemorySuggestions(conversationId, botUserId)) > 0) {
          await refreshMemories();
          showToast('New things to remember are waiting in Memory.', 'info');
        }
      } finally {
        suggestingRef.current = false;
      }
    },
    [conversationId, userId, refreshMemories, showToast],
  );

  // Ask for the character's reply. Used for the first answer, retries and the opening.
  const askForReply = useCallback(
    async (botUserId: string, opening = false) => {
      if (!conversationId || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setReplyError(null);
      try {
        await requestCharacterReply({ conversationId, botUserId, isInitiation: opening });
        const rows = await loadMessages();
        void maybeSuggestMemories(rows, botUserId);
      } catch (error) {
        setReplyError(error instanceof Error ? error.message : 'The character could not answer right now.');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [conversationId, loadMessages, maybeSuggestMemories],
  );

  useEffect(() => {
    if (!user || !conversationId) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    setMenu(null);
    setEditing(null);
    setDeleting(null);
    setReporting(null);
    setFeedback({});
    feedbackLoadedRef.current = new Set();
    (async () => {
      try {
        const { data: conversation, error: conversationError } = await supabase
          .from('conversations')
          .select('id, type, name, created_by, memory_summary, canon_revision, conversation_participants(user_id, persona_id, persona_selected)')
          .eq('id', conversationId)
          .maybeSingle();
        if (conversationError) throw conversationError;
        const participants = ((conversation?.conversation_participants ?? []) as Array<{ user_id: string; persona_id: string | null; persona_selected: boolean | null }>);
        const botUserId = participants.find((p) => p.user_id !== user.id)?.user_id;
        if (!conversation || conversation.type !== 'dm' || !botUserId) {
          if (active) setLoadError('This scene is unavailable.');
          return;
        }
        const [{ data: character }, { data: profile }] = await Promise.all([
          supabase.from('ai_characters').select('id, creator_id, name:chat_name, greeting, alternate_greetings, content_rating').eq('user_id', botUserId).maybeSingle(),
          supabase.from('profiles').select('display_name').eq('user_id', botUserId).maybeSingle(),
        ]);
        if (!active) return;
        // CHIMERA's list can also hold ordinary WHISPRR conversations. Only a scene with a character opens here.
        if (!character) {
          setLoadError('This scene is unavailable.');
          return;
        }
        const info: SceneInfo = {
          botUserId,
          characterId: character.id,
          botName: character.name || profile?.display_name || 'Character',
          title: conversation.name?.trim() || null,
          greeting: character.greeting?.trim() || null,
          createdByMe: (conversation as { created_by?: string | null }).created_by === user.id,
          characterMine: (character as { creator_id?: string | null }).creator_id === user.id,
          openings: cleanOpenings(character.greeting, (character as { alternate_greetings?: unknown }).alternate_greetings),
          rating: character.content_rating ?? null,
          canon: conversation.memory_summary ?? '',
          canonRevision: Number(conversation.canon_revision ?? 0),
        };
        setScene(info);
        const ownRow = participants.find((p) => p.user_id === user.id);
        memoryContextRef.current = { characterId: info.characterId, personaId: ownRow?.persona_id ?? null };
        setCanonDraft(info.canon);
        setTitleDraft(info.title ?? '');
        const saved = await loadSceneSettings(conversationId, user.id);
        if (!active) return;
        settingsRef.current = saved.settings;
        setSettings(saved.settings);
        setSettingsReady(saved.ready);
        setBannedDraft(saved.settings.bannedWords);
        try {
          const mine = await loadMyPersonas(user.id);
          const row = participants.find((p) => p.user_id === user.id);
          // Same rule as the database: a chosen persona (or none) wins, otherwise the default persona.
          const effective = row?.persona_selected ? row.persona_id ?? null : row?.persona_id ?? mine.find((p) => p.is_default)?.id ?? null;
          if (active) {
            setPersonas(mine);
            setPersonaId(effective);
            setPersonaSelected(!!row?.persona_selected);
            memoryContextRef.current = { characterId: info.characterId, personaId: effective };
          }
        } catch {
          // Personas are optional; the scene works without the picker.
        }

        const rows = await loadMessages();
        void refreshMemories();
        const { data: active_point } = await supabase
          .from('roleplay_turning_points')
          .select('id, title, scene_prompt, choices, reward_shards, status, selected_choice_id')
          .eq('conversation_id', conversationId)
          .eq('status', 'active')
          .maybeSingle();
        if (!active) return;
        setTurningPoint((active_point as GuidedTurningPoint | null) ?? null);
        setLoading(false);

        // A brand-new scene opens with the character's own greeting. With several openings the player picks one (see the
        // picker below), so nothing is written until they do.
        if (rows.length === 0 && info.openings.length <= 1 && !(isAdultRating(info.rating) && !adultAccess)) {
          if (info.greeting) {
            const { error } = await supabase.rpc('respond_as_ai_character', {
              p_conversation_id: conversationId,
              p_bot_id: botUserId,
              p_content: info.greeting,
            });
            if (error) throw error;
            if (active) await loadMessages();
          } else if (active) {
            await askForReply(botUserId, true);
          }
        }
      } catch {
        if (active) setLoadError('We could not open this scene. Please try again in a moment.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // adultAccess only decides whether to auto-open an empty scene on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, conversationId, loadMessages, askForReply, refreshMemories]);

  // The member's own likes and dislikes of the character's messages, read once for each message.
  useEffect(() => {
    if (!FEEDBACK_LIVE || !scene) return;
    const ids = messages.filter((m) => m.sender_id === scene.botUserId && !feedbackLoadedRef.current.has(m.id)).map((m) => m.id);
    if (ids.length === 0) return;
    ids.forEach((id) => feedbackLoadedRef.current.add(id));
    loadMyFeedback(ids).then(
      (found) => setFeedback((current) => ({ ...found, ...current })),
      () => ids.forEach((id) => feedbackLoadedRef.current.delete(id)),
    );
  }, [messages, scene]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length, busy]);

  // Writes the opening the player picked as the scene's first message.
  const beginWith = async (opening: string) => {
    if (!scene || !conversationId || openingBusyRef.current) return;
    openingBusyRef.current = true;
    setOpeningBusy(true);
    try {
      const { error } = await supabase.rpc('respond_as_ai_character', { p_conversation_id: conversationId, p_bot_id: scene.botUserId, p_content: opening });
      if (error) throw error;
      await loadMessages();
    } catch {
      showToast('We could not begin the scene. Please try again.', 'error');
    } finally {
      openingBusyRef.current = false;
      setOpeningBusy(false);
    }
  };

  if (loading || accessLoading) return <p className="px-5 py-24 text-center text-chimera-mute">Opening the scene…</p>;

  if (loadError || !scene || !user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Scene unavailable</h1>
        <p className="mt-3 text-chimera-mute">{loadError ?? 'This scene may have been removed.'}</p>
        <Link to="/chats" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Back to your scenes</Link>
      </div>
    );
  }

  const adultLocked = isAdultRating(scene.rating) && !adultAccess;
  // An empty scene of a character with several openings waits for the player to pick one.
  const choosingOpening = messages.length === 0 && scene.openings.length > 1 && !adultLocked;
  const last = messages[messages.length - 1];
  const awaitingReply = !!last && last.sender_id === user.id;
  const canRegenerate = !!last && last.sender_id === scene.botUserId && messages.length > 1 && !busy;
  const hasPlayerMessages = messages.some((m) => m.sender_id === user.id);
  const personaName = personas.find((p) => p.id === personaId)?.name ?? null;

  // Who may change a message: its author, and the owner of the scene for the character's messages in it.
  // The database enforces the same rule; this only decides what the menu offers.
  const isMine = (message: ChatMessageRow) => message.sender_id === user.id;
  const mayChange = (message: ChatMessageRow) => isMine(message) || (message.sender_id === scene.botUserId && scene.createdByMe);

  const copyMessage = async (message: ChatMessageRow) => {
    const done = await copyText(message.content);
    showToast(done ? 'Message copied.' : 'We could not copy that. Select the text and copy it instead.', done ? 'success' : 'error');
  };

  const startEdit = (message: ChatMessageRow) => setEditing({ id: message.id, text: message.content, saving: false, problem: null });

  const saveEdit = async () => {
    if (!editing || editing.saving) return;
    const original = messages.find((m) => m.id === editing.id);
    if (!original) {
      setEditing(null);
      return;
    }
    const text = editing.text.replace(/\r\n/g, '\n').trim();
    if (!text) {
      setEditing({ ...editing, problem: 'A message cannot be empty. Delete it instead.' });
      return;
    }
    if (text === original.content.trim()) {
      setEditing(null);
      return;
    }
    setEditing({ ...editing, saving: true, problem: null });
    // The database refuses anyone but the author (or the scene owner, for the character's messages).
    const { data, error } = await supabase.from('messages').update({ content: text }).eq('id', original.id).eq('conversation_id', conversationId!).is('deleted_at', null).select('id');
    if (error || !data?.length) {
      setEditing({ ...editing, saving: false, problem: 'We could not save your change. Please try again.' });
      return;
    }
    setMessages((rows) => rows.map((row) => (row.id === original.id ? { ...row, content: text } : row)));
    if (messages[messages.length - 1]?.id === original.id) {
      void supabase.from('conversations').update({ last_message: text }).eq('id', conversationId!).then(() => undefined, () => undefined);
    }
    setEditing(null);
    showToast('Message updated.', 'success');
  };

  const confirmDelete = async () => {
    if (!deleting || deleting.busy) return;
    const target = messages.find((m) => m.id === deleting.id);
    setDeleting({ ...deleting, busy: true });
    // Deleting hides the message everywhere (it is no longer shown, sent to the character or copied into a new chat).
    const { data, error } = await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', deleting.id).eq('conversation_id', conversationId!).is('deleted_at', null).select('id');
    if (error || !data?.length) {
      setDeleting(null);
      showToast('We could not delete that message. Please try again.', 'error');
      return;
    }
    const remaining = messages.filter((m) => m.id !== deleting.id);
    setMessages(remaining);
    if (settingsRef.current.pinnedMessageIds.includes(deleting.id)) {
      void updateSettings({ pinnedMessageIds: settingsRef.current.pinnedMessageIds.filter((id) => id !== deleting.id) }, 'We could not update your pins.');
    }
    const newest = remaining[remaining.length - 1];
    if (target && newest && messages[messages.length - 1]?.id === target.id) {
      void supabase.from('conversations').update({ last_message: newest.content, last_message_at: newest.created_at }).eq('id', conversationId!).then(() => undefined, () => undefined);
    }
    setDeleting(null);
    showToast('Message deleted.', 'success');
  };

  const branchFrom = async (message: ChatMessageRow) => {
    if (branchingId || busyRef.current) return;
    setBranchingId(message.id);
    try {
      const { data, error } = await supabase.rpc('branch_chimera_conversation', {
        p_conversation_id: conversationId,
        p_message_id: message.id,
        p_request_id: crypto.randomUUID(),
      });
      const created = (Array.isArray(data) ? data[0] : data) as { conversation_id?: string } | null;
      if (error || !created?.conversation_id) throw error ?? new Error('Branch not created');
      showToast('A new chat was started from that message. This one is unchanged.', 'success');
      navigate(`/chats/${created.conversation_id}`);
    } catch {
      showToast('We could not start a new chat from here. Please try again.', 'error');
    } finally {
      setBranchingId(null);
    }
  };

  const rateMessage = async (message: ChatMessageRow, rating: Rating) => {
    const before = feedback[message.id];
    const next = before === rating ? null : rating;
    const apply = (value: Rating | null | undefined) =>
      setFeedback((current) => {
        const copy = { ...current };
        if (value) copy[message.id] = value;
        else delete copy[message.id];
        return copy;
      });
    apply(next);
    try {
      await setMessageFeedback(message.id, next);
    } catch {
      apply(before);
      showToast('We could not save your feedback. Please try again.', 'error');
    }
  };

  const jumpTo = (messageId: string) => document.getElementById(`msg-${messageId}`)?.scrollIntoView?.({ block: 'center', behavior: scrollBehavior() });

  const menuItems = (message: ChatMessageRow): MenuItem[] => {
    const pinned = pinnedIds.includes(message.id);
    const allowed = mayChange(message);
    return [
      { id: 'copy', label: 'Copy message', icon: <Copy size={18} />, onSelect: () => void copyMessage(message) },
      {
        id: 'edit',
        label: 'Edit message',
        icon: <Pencil size={18} />,
        disabled: !allowed || busy,
        hint: busy ? `Wait for ${scene.botName} to finish` : undefined,
        onSelect: () => startEdit(message),
      },
      { id: 'pin', label: pinned ? 'Unpin message' : 'Pin message', icon: <Pin size={18} className={pinned ? 'fill-current' : ''} />, disabled: !settingsReady, onSelect: () => void togglePinned(message.id) },
      { id: 'branch', label: 'Start new chat from here', icon: <GitBranch size={18} />, disabled: busy || !!branchingId, onSelect: () => void branchFrom(message) },
      ...(FEEDBACK_LIVE && message.sender_id === scene.botUserId
        ? [
            { id: 'like', label: feedback[message.id] === 1 ? 'Remove like' : 'Like response', icon: <ThumbsUp size={18} className={feedback[message.id] === 1 ? 'fill-current' : ''} />, onSelect: () => void rateMessage(message, 1) },
            { id: 'dislike', label: feedback[message.id] === -1 ? 'Remove dislike' : 'Dislike response', icon: <ThumbsDown size={18} className={feedback[message.id] === -1 ? 'fill-current' : ''} />, onSelect: () => void rateMessage(message, -1) },
          ]
        : []),
      {
        id: 'delete',
        label: 'Delete message',
        icon: <Trash2 size={18} />,
        danger: true,
        disabled: !allowed || busy || messages.length <= 1,
        hint: messages.length <= 1 ? 'A scene keeps at least one message' : undefined,
        onSelect: () => setDeleting({ id: message.id, busy: false }),
      },
      ...(MODERATION_LIVE && !isMine(message)
        ? [{ id: 'report', label: 'Report message', icon: <Flag size={18} />, onSelect: () => setReporting({ id: message.id, speaker: scene.botName }) }]
        : []),
    ];
  };
  const menuMessage = menu ? messages.find((m) => m.id === menu.messageId) ?? null : null;
  const laterThanEdited = editing ? messages.findIndex((m) => m.id === editing.id) < messages.length - 1 : false;

  const changePersona = async (value: string) => {
    const next = value === 'none' ? null : value;
    const previous = personaId;
    setPersonaId(next);
    const { error } = await supabase.rpc('set_chimera_scene_persona', { p_conversation_id: conversationId, p_persona_id: next });
    if (error) {
      setPersonaId(previous);
      showToast('We could not change your persona. Please try again.', 'error');
      return;
    }
    setPersonaSelected(true);
    // Memories are kept per persona, so the list follows the persona.
    if (memoryContextRef.current) memoryContextRef.current = { ...memoryContextRef.current, personaId: next };
    void refreshMemories();
  };

  // Changes are saved one at a time, in the order they were made, and each writes only what it changed.
  // Two quick clicks can therefore never overwrite each other. If any save fails, the screen
  // reloads what is really saved once the queue is empty, so it never shows a choice that was not kept.
  const updateSettings = (patch: Partial<SceneSettings>, failure: string): Promise<boolean> => {
    if (!settingsReady) return Promise.resolve(false);
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    pendingSavesRef.current += 1;
    const run = saveChainRef.current.then(async () => {
      let saved = true;
      try {
        await saveSceneSettings(conversationId!, user.id, patch);
      } catch {
        saved = false;
        failedSaveRef.current = true;
        showToast(failure, 'error');
      }
      pendingSavesRef.current -= 1;
      if (pendingSavesRef.current === 0 && failedSaveRef.current) {
        failedSaveRef.current = false;
        const fresh = await loadSceneSettings(conversationId!, user.id);
        if (fresh.ready) {
          settingsRef.current = fresh.settings;
          setSettings(fresh.settings);
          setBannedDraft(fresh.settings.bannedWords);
        } else {
          setSettingsReady(false);
        }
      }
      return saved;
    });
    saveChainRef.current = run;
    return run;
  };

  const pinnedIds = settings.pinnedMessageIds.filter((id) => messages.some((m) => m.id === id));

  const togglePinned = async (messageId: string) => {
    const current = settingsRef.current.pinnedMessageIds.filter((id) => messages.some((m) => m.id === id));
    const next = togglePin(current, messageId);
    if (!next) {
      showToast(`You can pin up to ${SCENE_LIMITS.pins} messages. Unpin one first.`, 'info');
      return;
    }
    await updateSettings({ pinnedMessageIds: next }, 'We could not save that pin. Please try again.');
  };

  const saveTitle = async () => {
    if (toolsBusy) return;
    setToolsBusy(true);
    try {
      const title = await renameScene(conversationId!, titleDraft);
      setScene({ ...scene, title });
      setTitleDraft(title ?? '');
      showToast(title ? 'Scene renamed.' : `This scene is named after ${scene.botName} again.`, 'success');
    } catch {
      showToast('We could not rename this scene. Please try again.', 'error');
    } finally {
      setToolsBusy(false);
    }
  };

  const saveBannedWords = async () => {
    if (toolsBusy) return;
    setToolsBusy(true);
    const saved = await updateSettings({ bannedWords: bannedDraft.trim() }, 'We could not save your word list. Please try again.');
    if (saved) {
      setBannedDraft(bannedDraft.trim());
      showToast('Saved. It applies from the next reply.', 'success');
    }
    setToolsBusy(false);
  };

  const startOver = async () => {
    if (toolsBusy || busyRef.current) return;
    setToolsBusy(true);
    try {
      const result = await startOverScene({
        userId: user.id,
        botUserId: scene.botUserId,
        title: scene.title,
        canon: keepMemory ? scene.canon : '',
        persona: { selected: personaSelected, id: personaId },
        settings: settingsReady ? settings : null,
      });
      if (result.warnings.length > 0) {
        showToast('The new scene is ready, but some of your choices were not carried over. You can set them again.', 'info');
      }
      setConfirming(null);
      setPanelOpen(false);
      navigate(`/chats/${result.id}`);
    } catch {
      showToast('We could not start a new scene. Nothing was changed.', 'error');
    } finally {
      setToolsBusy(false);
    }
  };

  const removeScene = async () => {
    if (toolsBusy || busyRef.current) return;
    setToolsBusy(true);
    try {
      await deleteScene(conversationId!);
      showToast('Scene deleted.', 'success');
      navigate('/chats');
    } catch {
      showToast('We could not delete this scene. Please try again.', 'error');
      setToolsBusy(false);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || busyRef.current || adultLocked || choosingOpening) return;
    const line = formatPlayerLine(mode, text);
    busyRef.current = true;
    setBusy(true);
    setReplyPending(true);
    setReplyError(null);
    try {
      const message = pendingSendsRef.current!.prepare({
        conversation_id: conversationId!,
        sender_id: user.id,
        content: line,
      });
      await persistPlayerMessage(supabase, message);
      pendingSendsRef.current!.confirm(message);
      setDraft('');
    } catch (error) {
      showToast(error instanceof PendingPlayerSendError ? error.message : 'Your message could not be sent. Your draft is still here.', 'error');
      busyRef.current = false;
      setBusy(false);
      setReplyPending(false);
      return;
    }
    busyRef.current = false;
    setBusy(false);
    // The reply request reloads the conversation, and shows a retry if it fails.
    await loadMessages().catch(() => undefined);
    try {
      await askForReply(scene.botUserId);
    } finally {
      setReplyPending(false);
    }
  };

  const regenerate = async () => {
    if (!last || !canRegenerate || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setReplyError(null);
    try {
      await requestCharacterReply({
        conversationId: conversationId!,
        botUserId: scene.botUserId,
        swipe: { messageId: last.id, expectedContent: last.content, retryId: crypto.randomUUID() },
      });
      await loadMessages();
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'The character could not answer right now.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const saveCanon = async () => {
    setSavingCanon(true);
    const { data: revision, error } = await supabase.rpc('save_chimera_scene_canon', {
      p_conversation_id: conversationId,
      p_expected_revision: scene.canonRevision,
      p_content: canonDraft.trim(),
    });
    setSavingCanon(false);
    if (error) {
      showToast('Could not save the scene memory. Reopen the scene and try again.', 'error');
      return;
    }
    setScene({ ...scene, canon: canonDraft.trim(), canonRevision: Number(revision) });
    showToast('This scene will remember that.', 'success');
  };

  const approveSuggestion = async (memory: SceneMemory, acrossScenes: boolean) => {
    if (memoryBusy) return;
    setMemoryBusy(memory.id);
    try {
      await approveMemory(memory, acrossScenes);
      await refreshMemories();
      showToast(acrossScenes ? `${scene.botName} will remember this in every scene you play together.` : 'This scene will remember that.', 'success');
    } catch (error) {
      const text = error instanceof Error ? error.message : (error as { message?: string } | null)?.message ?? '';
      if (/Source changed/i.test(text)) {
        showToast('The messages behind this suggestion have changed, so it cannot be kept. You can dismiss it.', 'error');
      } else {
        showToast('We could not keep that memory. Please try again.', 'error');
        await refreshMemories();
      }
    } finally {
      setMemoryBusy(null);
    }
  };

  const saveMemoryEdit = async () => {
    if (!editingMemory || memoryBusy) return;
    const text = editingMemory.text.trim();
    if (text.length < 8) {
      showToast('A memory needs at least a short sentence.', 'info');
      return;
    }
    setMemoryBusy(editingMemory.id);
    try {
      const updatedAt = await editMemory(editingMemory.id, text);
      setMemories((list) => list.map((m) => (m.id === editingMemory.id ? { ...m, content: text.slice(0, MEMORY_LIMITS.content), updatedAt } : m)));
      setEditingMemory(null);
    } catch {
      showToast('We could not save that change. Please try again.', 'error');
    } finally {
      setMemoryBusy(null);
    }
  };

  const forgetMemory = async (memory: SceneMemory) => {
    if (memoryBusy) return;
    setMemoryBusy(memory.id);
    try {
      await deleteMemory(memory.id);
      setMemories((list) => list.filter((m) => m.id !== memory.id));
    } catch {
      showToast('We could not remove that memory. Please try again.', 'error');
    } finally {
      setMemoryBusy(null);
    }
  };

  // Written by hand: the player's own words, kept at once. For this scene only, or for every scene with this character as this persona.
  const addMemoryByHand = async () => {
    if (memoryBusy || !memoryContextRef.current) return;
    // The screen holds the memories that apply to this chat: its own and the ones for every chat (that is what the character reads).
    if (memories.length >= MAX_MEMORIES) {
      showToast(`This chat already has ${MAX_MEMORIES} memories (its own and the ones for every chat). Forget one first.`, 'info');
      return;
    }
    // What was submitted, kept apart from the form: the player may keep typing while the save is under way.
    const submitted = newMemory;
    setMemoryBusy('new');
    try {
      // The ones for every chat appear in all of this character's chats: they are counted in the database, not on the screen's list.
      if (submitted.everywhere && (await countEveryChatMemories(memoryContextRef.current.characterId, memoryContextRef.current.personaId)) >= MAX_MEMORIES) {
        showToast(`There are already ${MAX_MEMORIES} memories for every chat. Forget one first.`, 'info');
        return;
      }
      await addMemory({
        userId: user.id,
        characterId: memoryContextRef.current.characterId,
        personaId: memoryContextRef.current.personaId,
        conversationId: submitted.everywhere ? null : conversationId!,
        type: submitted.type,
        content: submitted.text,
        certainty: submitted.certainty,
        knownBy: submitted.knownBy,
      });
      // Empties the box only if it still holds what was just saved; newer typing and choices stay.
      setNewMemory((current) => (current.text === submitted.text ? { ...current, text: '' } : current));
      await refreshMemories();
      showToast(submitted.everywhere ? `${scene.botName} will remember this in every chat.` : 'This chat will remember that.', 'success');
    } catch {
      showToast('We could not save that memory. What you wrote is still here.', 'error');
    } finally {
      setMemoryBusy(null);
    }
  };

  // Moves a kept memory between this chat only and every chat with this character (as this persona).
  const moveMemory = async (memory: SceneMemory) => {
    if (memoryBusy) return;
    if (memory.conversationId && !canBeEverywhere(memory.certainty)) {
      showToast('Only a confirmed memory can be kept for every chat. Mark it confirmed first.', 'info');
      return;
    }
    setMemoryBusy(memory.id);
    try {
      // Memories for every chat appear in all of the character's chats, so there is room for this many of them only. Counted in the
      // database: the screen's list is cut at 100 and mixes in this chat's own memories.
      if (memory.conversationId && memoryContextRef.current) {
        const everywhere = await countEveryChatMemories(memoryContextRef.current.characterId, memoryContextRef.current.personaId);
        if (everywhere >= MAX_MEMORIES) {
          showToast(`There are already ${MAX_MEMORIES} memories for every chat. Forget one first.`, 'info');
          return;
        }
      }
      const to = memory.conversationId ? null : conversationId!;
      const updatedAt = await setMemoryScope(memory.id, to);
      setMemories((list) => list.map((m) => (m.id === memory.id ? { ...m, conversationId: to, updatedAt } : m)));
    } catch {
      showToast('We could not change where this memory applies. Nothing was changed.', 'error');
    } finally {
      setMemoryBusy(null);
    }
  };

  // How sure the story is about a kept memory, and who knows it. A memory the player keeps to themselves is never sent to the AI.
  const adjustMemory = async (memory: SceneMemory, patch: { certainty?: MemoryCertainty; knownBy?: KnownBy }) => {
    if (memoryBusy) return;
    setMemoryBusy(memory.id);
    try {
      const updatedAt = await setMemoryNature(memory, patch);
      setMemories((list) => list.map((m) => (m.id === memory.id ? { ...m, ...(patch.certainty ? { certainty: patch.certainty } : {}), ...(patch.knownBy ? { knownBy: patch.knownBy } : {}), updatedAt } : m)));
    } catch {
      showToast('We could not change that. Nothing was changed.', 'error');
    } finally {
      setMemoryBusy(null);
    }
  };

  const proposedMemories = memories.filter((m) => m.status === 'proposed');
  const approvedMemories = memories.filter((m) => m.status === 'approved');

  const openPanel = (tab?: PanelTabId) => {
    if (tab) setPanelTab(tab);
    setFocusPanel(true);
    setPanelOpen(true);
    if (desktop) writePanelOpen(true);
  };
  const closePanel = () => {
    setFocusPanel(false);
    setPanelOpen(false);
    if (desktop) {
      writePanelOpen(false);
      toggleRef.current?.focus();
    }
  };

  // Reads everything again from the database. It only reads: nothing stored is changed or removed.
  const refreshConversation = async () => {
    if (toolsBusy || busyRef.current) return;
    setToolsBusy(true);
    try {
      await loadMessages();
      await refreshMemories();
      setHistoryKey((key) => key + 1);
      showToast('Up to date. Nothing was removed.', 'success');
    } catch {
      showToast('We could not refresh right now. Your messages are safe; try again in a moment.', 'error');
    } finally {
      setToolsBusy(false);
    }
  };

  const openTurningPoint = async () => {
    if (turningPointLoading) return;
    setTurningPointLoading(true);
    try {
      setTurningPoint(await requestTurningPoint(conversationId!, scene.botUserId));
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
      const { data, error } = await supabase.rpc('claim_my_roleplay_turning_point', {
        p_turning_point_id: turningPoint.id,
        p_choice_id: choice.id,
      });
      if (error) throw error;
      const reward = Array.isArray(data) ? data[0] : data;
      setTurningPoint(null);
      setMode('say');
      setDraft(`[Turning Point — ${choice.key}]: ${choice.label}`);
      if (reward?.memory_note) {
        setScene((current) => (current ? { ...current, canon: [current.canon, reward.memory_note].filter(Boolean).join('\n') } : current));
      }
      window.dispatchEvent(new Event('chimera-shards-changed'));
      showToast(`A new path has opened. +${reward?.shards_awarded ?? 10} SHARDS`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not resolve this turning point.', 'error');
    } finally {
      setTurningPointLoading(false);
    }
  };

  const panelTabs: PanelTab[] = [
    { id: 'about', label: 'Character', icon: <Info size={16} /> },
    { id: 'chat', label: 'Chat', icon: <SlidersHorizontal size={16} /> },
    { id: 'history', label: 'History', icon: <History size={16} /> },
    { id: 'world', label: 'Lorebook', icon: <BookOpen size={16} /> },
    { id: 'universe', label: 'Universe', icon: <Globe size={16} /> },
    { id: 'memory', label: 'Memory', icon: <Brain size={16} />, badge: proposedMemories.length },
    { id: 'persona', label: 'Persona', icon: <User size={16} /> },
    { id: 'look', label: 'Look', icon: <Palette size={16} /> },
  ];

  const chatTools = (
    <>
    {!settingsReady && (
      <p role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Your saved choices for this scene could not be loaded, so length, words and pins are locked to keep them safe. Reload the page to try again. You can still rename, start over or delete.
      </p>
    )}

    <div>
      <label htmlFor="scene-title" className="block text-sm font-bold">Name this chat</label>
      <div className="mt-2 flex gap-2">
        <input
          id="scene-title"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          maxLength={SCENE_LIMITS.title}
          placeholder={scene.botName}
          className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-chimera-gold/25 bg-chimera-bg px-3 text-base text-chimera-ink outline-none focus:border-chimera-gold"
        />
        <button type="button" onClick={() => void saveTitle()} disabled={toolsBusy || titleDraft.trim() === (scene.title ?? '')} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">Save name</button>
      </div>
      <p className="mt-1 text-xs text-chimera-mute">Only you see this. Leave it empty to use {scene.botName}&apos;s name.</p>
    </div>

    <fieldset>
      <legend className="text-sm font-bold">How long are {scene.botName}&apos;s replies?</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {RESPONSE_LENGTHS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={settings.responseLength === option.id}
            title={option.hint}
            disabled={!settingsReady}
            onClick={() => void updateSettings({ responseLength: option.id }, 'We could not save that choice. Please try again.')}
            className={`min-h-[40px] rounded-full border px-5 text-sm font-bold ${settings.responseLength === option.id ? 'border-chimera-gold bg-chimera-gold text-[#1a1208]' : 'border-chimera-gold/35 hover:border-chimera-gold'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-chimera-mute">{RESPONSE_LENGTHS.find((o) => o.id === settings.responseLength)?.hint}. It applies from the next reply.</p>
    </fieldset>

    <div>
      <label htmlFor="scene-banned" className="block text-sm font-bold">Words {scene.botName} should avoid</label>
      <textarea
        id="scene-banned"
        value={bannedDraft}
        onChange={(e) => setBannedDraft(e.target.value)}
        maxLength={SCENE_LIMITS.bannedWords}
        rows={2}
        placeholder="For example: suddenly, orbs, shivers down your spine"
        className="mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/70 focus:border-chimera-gold"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-chimera-mute">Separate with commas. {bannedDraft.length} / {SCENE_LIMITS.bannedWords}</span>
        <button type="button" onClick={() => void saveBannedWords()} disabled={toolsBusy || !settingsReady || bannedDraft.trim() === settings.bannedWords.trim()} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">Save words</button>
      </div>
    </div>

    <div>
      <label className="flex min-h-[44px] items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={settings.autoMemory}
          disabled={!settingsReady}
          onChange={(e) => void updateSettings({ autoMemory: e.target.checked }, 'We could not save that choice. Please try again.')}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#e8c27a]"
        />
        <span>
          <span className="font-bold">Suggest things to remember</span>
          <span className="block text-xs text-chimera-mute">Every few messages the story may suggest memories for you to keep or dismiss. Nothing is used until you keep it.</span>
        </span>
      </label>
    </div>

    <div>
      <p className="text-sm font-bold">Pinned messages: {pinnedIds.length} of {SCENE_LIMITS.pins}</p>
      <p className="mt-1 text-xs text-chimera-mute">Open a message&apos;s menu (the three dots, or a long press) and choose Pin to keep it in {scene.botName}&apos;s mind, even when the conversation grows long.</p>
      {pinnedIds.length > 0 && (
        <ul className="mt-2 space-y-2" aria-label="Pinned messages">
          {messages.filter((m) => pinnedIds.includes(m.id)).map((m) => (
            <li key={m.id} className="flex items-start gap-2 rounded-xl border border-chimera-gold/20 bg-chimera-bg p-2">
              <button type="button" onClick={() => jumpTo(m.id)} className="min-h-[44px] min-w-0 flex-1 text-left text-sm">
                <span className="block text-xs font-bold tracking-[0.1em] text-chimera-gold">{isMine(m) ? 'YOU' : scene.botName.toUpperCase()}</span>
                <span className="block truncate">{plainText(m.content)}</span>
              </button>
              <button type="button" onClick={() => void togglePinned(m.id)} disabled={!settingsReady} aria-label={`Unpin: ${plainText(m.content).slice(0, 40)}`} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-3 text-xs font-bold hover:bg-chimera-gold/10 disabled:opacity-50">Unpin</button>
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="border-t border-chimera-gold/15 pt-4">
      {confirming === 'restart' ? (
        <div role="group" aria-label="Confirm starting over" className="space-y-3">
          <p className="text-sm">Start a new chat with {scene.botName}? This chat stays in your list exactly as it is.</p>
          <label className="flex min-h-[44px] items-center gap-3 text-sm">
            <input type="checkbox" checked={keepMemory} onChange={(e) => setKeepMemory(e.target.checked)} className="h-5 w-5 accent-[#e8c27a]" />
            Keep what this chat remembers
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void startOver()} disabled={toolsBusy} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">{toolsBusy ? 'Starting…' : 'Start new chat'}</button>
            <button type="button" onClick={() => setConfirming(null)} disabled={toolsBusy} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Cancel</button>
          </div>
        </div>
      ) : confirming === 'delete' ? (
        <div role="group" aria-label="Confirm deleting" className="space-y-3">
          <p className="text-sm text-red-100">Delete this chat for good? Every message and what it remembers will be gone. This cannot be undone.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void removeScene()} disabled={toolsBusy} className="min-h-[44px] rounded-full bg-chimera-rose px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">{toolsBusy ? 'Deleting…' : 'Delete this chat'}</button>
            <button type="button" onClick={() => setConfirming(null)} disabled={toolsBusy} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Keep it</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setConfirming('restart')} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Start new chat</button>
          <button type="button" onClick={() => setPanelTab('history')} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Chat history</button>
          <button type="button" onClick={() => void refreshConversation()} disabled={toolsBusy} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50"><RefreshCw size={16} aria-hidden="true" /> Refresh</button>
          <button type="button" onClick={() => setConfirming('delete')} className="min-h-[44px] rounded-full border border-chimera-rose/50 px-5 text-sm font-bold text-chimera-rose hover:bg-chimera-rose/10">Delete chat</button>
        </div>
      )}
    </div>
    </>
  );

  const memoryTools = (
    <div>
    <h3 className="font-serif text-lg font-semibold text-chimera-gold">Notes for this scene</h3>
    <p className="mt-1 text-sm text-chimera-mute">
      {scene.botName} reads the most recent part of the conversation each time; older messages fall out of view. Write here what must never be forgotten: names, places, promises, tone. Edit or clear it at any time.
    </p>
    <label htmlFor="canon" className="sr-only">Scene memory</label>
    <textarea
      id="canon"
      value={canonDraft}
      onChange={(e) => setCanonDraft(e.target.value)}
      maxLength={6000}
      rows={6}
      className="mt-3 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none focus:border-chimera-gold"
    />
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="text-xs text-chimera-mute">{canonDraft.length} / 6000</span>
      <button type="button" onClick={() => void saveCanon()} disabled={savingCanon || canonDraft.trim() === scene.canon.trim()} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">
        {savingCanon ? 'Saving…' : 'Save memory'}
      </button>
    </div>

    <div className="mt-6 border-t border-chimera-gold/15 pt-4">
      <h3 className="font-serif text-lg font-semibold text-chimera-gold">Memories</h3>
      <p className="mt-1 text-sm text-chimera-mute">
        Short things {scene.botName} should keep in mind: events, relationships, facts about the world, lasting traits. Every few messages the story can suggest some; {scene.botName} only uses a suggestion after you keep it. You can reword, move or remove any of them. Each one can be confirmed, temporary or an assumption, and you can keep it to yourself (&ldquo;Only me&rdquo;): {scene.botName} is then never told. Memories from your other chats are never mixed in unless you chose &ldquo;every chat&rdquo;, and they follow the persona you play ({personaName ?? 'yourself'}).
      </p>
      <form
        className="mt-3 space-y-3 rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void addMemoryByHand();
        }}
      >
        <label htmlFor="new-memory" className="block text-sm font-bold">Add a memory</label>
        <textarea
          id="new-memory"
          value={newMemory.text}
          onChange={(e) => setNewMemory({ ...newMemory, text: e.target.value })}
          maxLength={MEMORY_LIMITS.content}
          rows={2}
          placeholder="For example: Isolde owes Captain Rook a debt she will not admit."
          className="w-full rounded-lg border border-chimera-gold/25 bg-chimera-panel p-2 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/70 focus:border-chimera-gold"
        />
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="new-memory-type" className="block text-xs font-bold text-chimera-gold">Kind</label>
            <select id="new-memory-type" value={newMemory.type} onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as MemoryTypeId })} className="mt-1 min-h-[44px] rounded-lg border border-chimera-gold/25 bg-chimera-panel px-3 text-base text-chimera-ink outline-none focus:border-chimera-gold">
              {MEMORY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}: {t.hint}</option>)}
            </select>
          </div>
        </div>
        <MemoryNatureFields
          certainty={newMemory.certainty}
          knownBy={newMemory.knownBy}
          scopeIsEverywhere={newMemory.everywhere}
          characterName={scene.botName}
          onCertainty={(certainty) => setNewMemory((current) => ({ ...current, certainty, everywhere: canBeEverywhere(certainty) ? current.everywhere : false }))}
          onKnownBy={(knownBy) => setNewMemory((current) => ({ ...current, knownBy }))}
        />
        <fieldset>
          <legend className="text-xs font-bold text-chimera-gold">Applies to</legend>
          <label className="mt-1 flex min-h-[44px] items-center gap-3 text-sm">
            <input type="radio" name="new-memory-scope" checked={!newMemory.everywhere} onChange={() => setNewMemory({ ...newMemory, everywhere: false })} className="h-5 w-5 accent-[#e8c27a]" />
            This chat only
          </label>
          <label className="flex min-h-[44px] items-center gap-3 text-sm">
            <input type="radio" name="new-memory-scope" checked={newMemory.everywhere} disabled={!canBeEverywhere(newMemory.certainty)} onChange={() => setNewMemory({ ...newMemory, everywhere: true })} className="h-5 w-5 accent-[#e8c27a]" />
            Every chat with {scene.botName}{!canBeEverywhere(newMemory.certainty) && <span className="text-xs text-chimera-mute"> (only for confirmed memories)</span>}
          </label>
        </fieldset>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-chimera-mute">{newMemory.text.length} / {MEMORY_LIMITS.content}</span>
          <button type="submit" disabled={memoryBusy !== null || !newMemory.text.trim()} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">{memoryBusy === 'new' ? 'Saving…' : 'Add memory'}</button>
        </div>
      </form>
      {memoriesFailed && <p role="note" className="mt-3 text-sm text-amber-200">We could not load your memories right now.</p>}

      {proposedMemories.length > 0 && (
        <ul className="mt-3 space-y-3" aria-label="Suggested memories">
          {proposedMemories.map((memory) => (
            <li key={memory.id} className="rounded-xl border border-chimera-gold/35 bg-chimera-bg p-3">
              {editingMemory?.id === memory.id ? (
                <div>
                  <label htmlFor={`edit-${memory.id}`} className="sr-only">Memory text</label>
                  <textarea id={`edit-${memory.id}`} value={editingMemory.text} onChange={(e) => setEditingMemory({ id: memory.id, text: e.target.value })} maxLength={MEMORY_LIMITS.content} rows={3} className="w-full rounded-lg border border-chimera-gold/25 bg-chimera-panel p-2 text-base text-chimera-ink outline-none focus:border-chimera-gold" />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => void saveMemoryEdit()} disabled={memoryBusy === memory.id} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">Save wording</button>
                    <button type="button" onClick={() => setEditingMemory(null)} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base text-chimera-ink"><MemoryTags certainty={memory.certainty} knownBy={memory.knownBy} />{memory.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void approveSuggestion(memory, false)} disabled={memoryBusy !== null} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-chimera-gold px-4 text-sm font-bold text-[#1a1208] disabled:opacity-50"><Check size={16} aria-hidden="true" /> Keep for this scene</button>
                    {canBeEverywhere(memory.certainty) && (
                      <button type="button" onClick={() => void approveSuggestion(memory, true)} disabled={memoryBusy !== null} className="min-h-[44px] rounded-full border border-chimera-gold/50 px-4 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50">Keep for every scene with {scene.botName}</button>
                    )}
                    <button type="button" onClick={() => setEditingMemory({ id: memory.id, text: memory.content })} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/30 px-4 text-sm font-bold hover:bg-chimera-gold/10"><Pencil size={15} aria-hidden="true" /> Reword</button>
                    <button type="button" onClick={() => void forgetMemory(memory)} disabled={memoryBusy !== null} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-rose/40 px-4 text-sm font-bold text-chimera-rose hover:bg-chimera-rose/10 disabled:opacity-50"><Trash2 size={15} aria-hidden="true" /> Not worth keeping</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {approvedMemories.length > 0 ? (
        <ul className="mt-4 space-y-2" aria-label="Kept memories">
          {approvedMemories.map((memory) => (
            <li key={memory.id} className="rounded-xl border border-chimera-gold/15 p-3">
              {editingMemory?.id === memory.id ? (
                <div>
                  <label htmlFor={`edit-${memory.id}`} className="sr-only">Memory text</label>
                  <textarea id={`edit-${memory.id}`} value={editingMemory.text} onChange={(e) => setEditingMemory({ id: memory.id, text: e.target.value })} maxLength={MEMORY_LIMITS.content} rows={3} className="w-full rounded-lg border border-chimera-gold/25 bg-chimera-bg p-2 text-base text-chimera-ink outline-none focus:border-chimera-gold" />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => void saveMemoryEdit()} disabled={memoryBusy === memory.id} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">Save wording</button>
                    <button type="button" onClick={() => setEditingMemory(null)} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-base text-chimera-ink"><MemoryTags certainty={memory.certainty} knownBy={memory.knownBy} />{memory.content}</p>
                    <p className="mt-1 text-xs text-chimera-mute">{memoryTypeLabel(memory.type)} · {memory.conversationId ? 'This chat only' : `Every chat with ${scene.botName}`}</p>
                    {(memory.conversationId === null || canBeEverywhere(memory.certainty)) && (
                      <button type="button" onClick={() => void moveMemory(memory)} disabled={memoryBusy !== null} className="mt-1 min-h-[44px] rounded-full border border-chimera-gold/30 px-4 text-xs font-bold hover:bg-chimera-gold/10 disabled:opacity-50">{memory.conversationId ? `Keep for every chat with ${scene.botName}` : 'Keep for this chat only'}</button>
                    )}
                    <MemoryNatureEditor certainty={memory.certainty} knownBy={memory.knownBy} isEverywhere={memory.conversationId === null} disabled={memoryBusy !== null} characterName={scene.botName} onChange={(patch) => void adjustMemory(memory, patch)} />
                  </div>
                  <button type="button" onClick={() => setEditingMemory({ id: memory.id, text: memory.content })} aria-label="Reword this memory" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-chimera-mute hover:text-chimera-gold"><Pencil size={16} aria-hidden="true" /></button>
                  <button type="button" onClick={() => void forgetMemory(memory)} disabled={memoryBusy !== null} aria-label="Forget this memory" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-chimera-mute hover:text-chimera-rose disabled:opacity-50"><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        proposedMemories.length === 0 && !memoriesFailed && <p className="mt-3 text-sm text-chimera-mute">Nothing yet. After a few more messages the story may suggest something.</p>
      )}
    </div>
    </div>
  );

  const panelContent =
    panelTab === 'about' ? (
      <AboutSection characterId={scene.characterId} viewerId={user.id} fallbackName={scene.botName} />
    ) : panelTab === 'history' ? (
      <HistorySection
        userId={user.id}
        botUserId={scene.botUserId}
        botName={scene.botName}
        currentId={conversationId!}
        reloadKey={historyKey}
        onNewChat={() => {
          setConfirming('restart');
          setPanelTab('chat');
        }}
        onRenamedCurrent={(title) => {
          setScene({ ...scene, title });
          setTitleDraft(title ?? '');
        }}
        onOpen={() => !desktop && closePanel()}
      />
    ) : panelTab === 'world' ? (
      <LorebookSection
        characterId={scene.characterId}
        characterName={scene.botName}
        viewerId={user.id}
        isCreator={scene.characterMine}
        recentMessages={() => messages.slice(-10).map((m) => m.content)}
      />
    ) : panelTab === 'universe' ? (
      <UniverseSection conversationId={conversationId!} userId={user.id} />
    ) : panelTab === 'look' ? (
      <LookSection look={look} saved={lookSaved} wallpaper={wallpaper} characterName={scene.botName} onChange={changeLook} onReset={resetLook} />
    ) : panelTab === 'memory' ? (
      memoryTools
    ) : panelTab === 'persona' ? (
      <PersonaSection
        personas={personas}
        personaId={personaId}
        locked={hasPlayerMessages}
        botName={scene.botName}
        onChoose={(id) => void changePersona(id ?? 'none')}
        onNewChat={() => {
          setConfirming('restart');
          setPanelTab('chat');
        }}
      />
    ) : (
      chatTools
    );

  return (
    <div className="relative isolate">
    {look.motion !== 'calm' && <WallpaperLayer setting={wallpaper.setting} imageUrl={wallpaper.imageUrl} />}
    <div className="mx-auto flex max-w-[78rem] items-start justify-center gap-6 lg:px-4">
    <div className="chat-look flex min-h-[calc(100dvh-5rem)] w-full min-w-0 max-w-3xl flex-col px-4 pb-4 pt-4 sm:px-6 lg:px-0" {...lookAttributes(look)}>
      <header className="mb-3 flex items-center gap-3">
        <Link to="/chats" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-chimera-gold/30 hover:bg-chimera-gold/10" aria-label="Back to your scenes">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-2xl font-semibold">{scene.title ?? scene.botName}</h1>
          {scene.title && <p className="truncate text-xs text-chimera-mute">with {scene.botName}</p>}
        </div>
        <button
          ref={toggleRef}
          type="button"
          onClick={() => (panelOpen ? closePanel() : openPanel())}
          aria-expanded={panelOpen}
          aria-controls="scene-panel"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10"
        >
          <SlidersHorizontal size={18} aria-hidden="true" /> <span className="hidden sm:inline">Manage</span><span className="sr-only sm:hidden">Manage this chat</span>
          {proposedMemories.length > 0 && (
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-chimera-gold px-1.5 text-xs font-bold text-[#1a1208]" aria-label={`${proposedMemories.length} memory suggestions to review`}>{proposedMemories.length}</span>
          )}
        </button>
      </header>

      {(personas.length > 0 || personaName) && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-chimera-mute">Playing as</span>
          {hasPlayerMessages ? (
            <>
              <span className="font-bold text-chimera-ink">{personaName ?? 'yourself'}</span>
              <span className="text-chimera-mute">(fixed once the story has begun, so {scene.botName} always knows who you are)</span>
            </>
          ) : (
            <>
              <label htmlFor="scene-persona-switch" className="sr-only">Playing as</label>
              <select
                id="scene-persona-switch"
                value={personaId ?? 'none'}
                onChange={(e) => void changePersona(e.target.value)}
                className="rounded-full border border-chimera-gold/35 bg-chimera-bg px-4 py-2 text-sm font-bold text-chimera-ink outline-none focus:border-chimera-gold"
              >
                {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="none">Myself, no persona</option>
              </select>
            </>
          )}
        </div>
      )}

      {adultLocked && (
        <p role="note" className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          This character is rated Mature or NSFW. You can read this scene, but replies are paused until {AGE_VERIFICATION_LIVE || ADULT_CONFIRMATION_LIVE
            ? <>{AGE_VERIFICATION_LIVE ? 'your age is verified' : 'you have confirmed that you are 18 or older'} and adult content is turned on in the <Link to="/adult-content-settings" className="font-bold underline">Adult Content Settings</Link>.</>
            : <>age verification opens. It is <Link to="/adult-content-settings" className="font-bold underline">coming soon</Link>.</>}
        </p>
      )}

      <div className="msg-list flex-1 py-2" aria-live="polite">
        {choosingOpening && (
          <section aria-labelledby="opening-picker" className="rounded-2xl border border-chimera-gold/30 bg-chimera-panel p-4">
            <h2 id="opening-picker" className="font-serif text-2xl font-semibold">How should this scene begin?</h2>
            <p className="mt-1 text-sm text-chimera-mute">{scene.botName} has {scene.openings.length} ways to open a scene. Pick one, or let chance choose.</p>
            <ul className="mt-4 flex flex-col gap-3">
              {scene.openings.map((opening, index) => (
                <li key={index} className="rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3">
                  <p className="text-xs font-bold tracking-[0.12em] text-chimera-gold">OPENING {index + 1}</p>
                  <p className="mt-1 max-h-56 overflow-y-auto whitespace-pre-wrap text-[16px] leading-relaxed text-violet-50">{opening}</p>
                  <button type="button" onClick={() => void beginWith(opening)} disabled={openingBusy} aria-label={`Begin with opening ${index + 1}`} className="mt-3 min-h-[44px] rounded-full bg-chimera-gold px-5 font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
                    Begin with this one
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => void beginWith(surpriseOpening(scene.openings, Math.random()))} disabled={openingBusy} className="mt-4 min-h-[44px] rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10 disabled:opacity-50">
              Surprise me
            </button>
          </section>
        )}
        {messages.map((message) => {
          const mine = isMine(message);
          const editState = editing?.id === message.id
            ? {
                text: editing.text,
                saving: editing.saving,
                problem: editing.problem,
                maxLength: mine ? MESSAGE_EDIT_LIMITS.player : MESSAGE_EDIT_LIMITS.character,
                note: laterThanEdited ? 'The messages after this one are not rewritten. To continue from your change, start a new chat from here.' : undefined,
              }
            : null;
          return (
            <MessageRow
              key={message.id}
              id={message.id}
              mine={mine}
              speaker={mine ? null : scene.botName}
              content={message.content}
              pinned={pinnedIds.includes(message.id)}
              feedback={feedback[message.id] ?? null}
              edit={editState}
              onOpenMenu={(point) => setMenu({ messageId: message.id, anchor: point })}
              onEditChange={(text) => setEditing((current) => (current ? { ...current, text, problem: null } : current))}
              onEditSave={() => void saveEdit()}
              onEditCancel={() => setEditing(null)}
            />
          );
        })}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-chimera-mute" role="status">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {scene.botName} is writing…
          </p>
        )}
        {replyError && (
          <div role="alert" className="rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-sm text-red-100">
            <p>{replyError}</p>
            {(awaitingReply || messages.length === 0) && (
              <button type="button" onClick={() => void askForReply(scene.botUserId, messages.length === 0)} disabled={busy} className="mt-2 min-h-[40px] rounded-full border border-chimera-rose/50 px-4 font-bold hover:bg-chimera-rose/15 disabled:opacity-50">Try again</button>
            )}
          </div>
        )}
        {awaitingReply && !busy && !replyPending && !replyError && !adultLocked && !choosingOpening && (
          <button type="button" onClick={() => void askForReply(scene.botUserId, false)} className="min-h-[44px] rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">
            Ask {scene.botName} to reply
          </button>
        )}
      </div>

      {menu && menuMessage && <MessageMenu items={menuItems(menuMessage)} anchor={menu.anchor} onClose={() => setMenu(null)} />}
      {reporting && <ReportDialog speaker={reporting.speaker} onSubmit={(reason, details) => submitMessageReport(reporting.id, reason, details)} onClose={() => setReporting(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this message?"
          body={`It disappears from this scene, and ${scene.botName} will no longer remember it. This cannot be undone.`}
          confirmLabel="Delete"
          busyLabel="Deleting…"
          busy={deleting.busy}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}

      {messages.length >= TURNING_POINT_MIN_MESSAGES && !adultLocked && (
        <GuidedTurningPointCard point={turningPoint} loading={turningPointLoading} onOpen={() => void openTurningPoint()} onChoose={(choice) => void chooseTurningPoint(choice)} />
      )}

      <div className="sticky bottom-0 -mx-1 mt-2 bg-chimera-bg/95 px-1 pb-2 pt-2 backdrop-blur">
        <div className="mb-2 flex items-center gap-2" role="group" aria-label="How you write">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              title={m.hint}
              onClick={() => setMode(m.id)}
              className={`min-h-[36px] rounded-full border px-4 text-sm font-bold ${mode === m.id ? 'border-chimera-gold bg-chimera-gold text-[#1a1208]' : 'border-chimera-gold/35 text-violet-100/90 hover:border-chimera-gold'}`}
            >
              {m.label}
            </button>
          ))}
          {canRegenerate && (
            <button type="button" onClick={() => void regenerate()} className="ml-auto inline-flex min-h-[36px] items-center gap-2 rounded-full border border-chimera-gold/35 px-4 text-sm font-bold hover:border-chimera-gold">
              <RefreshCw size={15} aria-hidden="true" /> Regenerate
            </button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="composer" className="sr-only">Your message</label>
          <textarea
            id="composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            maxLength={4000}
            rows={2}
            disabled={adultLocked || choosingOpening}
            placeholder={MODES.find((m) => m.id === mode)?.hint}
            className="min-h-[56px] flex-1 resize-none rounded-2xl border border-chimera-gold/35 bg-chimera-panel px-4 py-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/70 focus:border-chimera-gold disabled:opacity-50"
          />
          <button type="submit" disabled={busy || !draft.trim() || adultLocked || choosingOpening} className="grid h-[56px] w-[56px] shrink-0 place-items-center rounded-full bg-chimera-gold text-[#1a1208] disabled:opacity-40" aria-label="Send">
            <Send size={22} aria-hidden="true" />
          </button>
        </form>
      </div>
      <div ref={endRef} />
    </div>
    {panelOpen && (
      <ManagementPanel desktop={desktop} title={scene.title ?? scene.botName} subtitle={scene.title ? `with ${scene.botName}` : undefined} tabs={panelTabs} active={panelTab} onTab={(id) => setPanelTab(id as PanelTabId)} onClose={closePanel} focusOnOpen={focusPanel}>
        {panelContent}
      </ManagementPanel>
    )}
    </div>
    </div>
  );
}
