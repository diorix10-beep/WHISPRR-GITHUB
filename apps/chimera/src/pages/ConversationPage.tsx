import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, Check, Loader2, Pencil, Pin, RefreshCw, Send, SlidersHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { isAdultRating, useAdultContentAccess } from '../hooks/useAdultContentAccess';
import {
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
import {
  MEMORY_LIMITS,
  approveMemory,
  deleteMemory,
  editMemory,
  loadMemories,
  requestMemorySuggestions,
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
  rating: string | null;
  canon: string;
  canonRevision: number;
}

const MODES: Array<{ id: ComposerMode; label: string; hint: string }> = [
  { id: 'say', label: 'Say', hint: 'Speak as your character' },
  { id: 'act', label: 'Act', hint: 'Describe what your character does' },
  { id: 'ooc', label: 'OOC', hint: 'Talk outside the story' },
];

// A turning point needs enough story behind it; the server checks this too.
const TURNING_POINT_MIN_MESSAGES = 8;

export default function ConversationPage() {
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
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [canonDraft, setCanonDraft] = useState('');
  const [savingCanon, setSavingCanon] = useState(false);
  const [turningPoint, setTurningPoint] = useState<GuidedTurningPoint | null>(null);
  const [turningPointLoading, setTurningPointLoading] = useState(false);
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [personaSelected, setPersonaSelected] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
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
    (async () => {
      try {
        const { data: conversation, error: conversationError } = await supabase
          .from('conversations')
          .select('id, type, name, memory_summary, canon_revision, conversation_participants(user_id, persona_id, persona_selected)')
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
          supabase.from('ai_characters').select('id, name:chat_name, greeting, content_rating').eq('user_id', botUserId).maybeSingle(),
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

        // A brand-new scene opens with the character's own greeting.
        if (rows.length === 0 && !(isAdultRating(info.rating) && !adultAccess)) {
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

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length, busy]);

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
  const last = messages[messages.length - 1];
  const awaitingReply = !!last && last.sender_id === user.id;
  const canRegenerate = !!last && last.sender_id === scene.botUserId && messages.length > 1 && !busy;
  const hasPlayerMessages = messages.some((m) => m.sender_id === user.id);
  const personaName = personas.find((p) => p.id === personaId)?.name ?? null;

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
      setToolsOpen(false);
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
    if (!text || busyRef.current || adultLocked) return;
    const line = formatPlayerLine(mode, text);
    busyRef.current = true;
    setBusy(true);
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
      return;
    }
    busyRef.current = false;
    setBusy(false);
    // The reply request reloads the conversation, and shows a retry if it fails.
    await loadMessages().catch(() => undefined);
    await askForReply(scene.botUserId);
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
    setMemoryOpen(false);
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

  const proposedMemories = memories.filter((m) => m.status === 'proposed');
  const approvedMemories = memories.filter((m) => m.status === 'approved');

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

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl flex-col px-4 pb-4 pt-4 sm:px-6">
      <header className="mb-3 flex items-center gap-3">
        <Link to="/chats" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-chimera-gold/30 hover:bg-chimera-gold/10" aria-label="Back to your scenes">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-2xl font-semibold">{scene.title ?? scene.botName}</h1>
          {scene.title && <p className="truncate text-xs text-chimera-mute">with {scene.botName}</p>}
        </div>
        <button
          type="button"
          onClick={() => setToolsOpen((open) => !open)}
          aria-expanded={toolsOpen}
          aria-controls="scene-tools"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10"
        >
          <SlidersHorizontal size={18} aria-hidden="true" /> <span className="hidden sm:inline">Scene</span><span className="sr-only sm:hidden">Scene tools</span>
        </button>
        <button
          type="button"
          onClick={() => setMemoryOpen((open) => !open)}
          aria-expanded={memoryOpen}
          aria-controls="scene-memory"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10"
        >
          <Brain size={18} aria-hidden="true" /> Memory
          {proposedMemories.length > 0 && (
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-chimera-gold px-1.5 text-xs font-bold text-[#1a1208]" aria-label={`${proposedMemories.length} suggestions to review`}>{proposedMemories.length}</span>
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

      {toolsOpen && (
        <section id="scene-tools" className="mb-3 space-y-5 rounded-2xl border border-chimera-gold/25 bg-chimera-panel p-4">
          <h2 className="font-serif text-xl font-semibold text-chimera-gold">Scene tools</h2>
          {!settingsReady && (
            <p role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Your saved choices for this scene could not be loaded, so length, words and pins are locked to keep them safe. Reload the page to try again. You can still rename, start over or delete.
            </p>
          )}

          <div>
            <label htmlFor="scene-title" className="block text-sm font-bold">Name this scene</label>
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
            <p className="mt-1 text-xs text-chimera-mute">Tap the pin under a message to keep it in {scene.botName}&apos;s mind, even when the conversation grows long.</p>
          </div>

          <div className="border-t border-chimera-gold/15 pt-4">
            {confirming === 'restart' ? (
              <div role="group" aria-label="Confirm starting over" className="space-y-3">
                <p className="text-sm">Start a new scene with {scene.botName}? This scene stays in your list exactly as it is.</p>
                <label className="flex min-h-[44px] items-center gap-3 text-sm">
                  <input type="checkbox" checked={keepMemory} onChange={(e) => setKeepMemory(e.target.checked)} className="h-5 w-5 accent-[#e8c27a]" />
                  Keep what this scene remembers
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void startOver()} disabled={toolsBusy} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">{toolsBusy ? 'Starting…' : 'Start new scene'}</button>
                  <button type="button" onClick={() => setConfirming(null)} disabled={toolsBusy} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Cancel</button>
                </div>
              </div>
            ) : confirming === 'delete' ? (
              <div role="group" aria-label="Confirm deleting" className="space-y-3">
                <p className="text-sm text-red-100">Delete this scene for good? Every message and what it remembers will be gone. This cannot be undone.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void removeScene()} disabled={toolsBusy} className="min-h-[44px] rounded-full bg-chimera-rose px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">{toolsBusy ? 'Deleting…' : 'Delete this scene'}</button>
                  <button type="button" onClick={() => setConfirming(null)} disabled={toolsBusy} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Keep it</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setConfirming('restart')} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Start over</button>
                <button type="button" onClick={() => setConfirming('delete')} className="min-h-[44px] rounded-full border border-chimera-rose/50 px-5 text-sm font-bold text-chimera-rose hover:bg-chimera-rose/10">Delete scene</button>
              </div>
            )}
          </div>
        </section>
      )}

      {memoryOpen && (
        <section id="scene-memory" className="mb-3 rounded-2xl border border-chimera-gold/25 bg-chimera-panel p-4">
          <h2 className="font-serif text-xl font-semibold text-chimera-gold">What this scene remembers</h2>
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
            <h3 className="font-serif text-lg font-semibold text-chimera-gold">Remembered from the story</h3>
            <p className="mt-1 text-sm text-chimera-mute">
              Every few messages the story can suggest things worth remembering. {scene.botName} only uses a suggestion after you keep it. You can reword or remove any of them.
            </p>
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
                        <p className="text-base text-chimera-ink">{memory.content}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => void approveSuggestion(memory, false)} disabled={memoryBusy !== null} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-chimera-gold px-4 text-sm font-bold text-[#1a1208] disabled:opacity-50"><Check size={16} aria-hidden="true" /> Keep for this scene</button>
                          <button type="button" onClick={() => void approveSuggestion(memory, true)} disabled={memoryBusy !== null} className="min-h-[44px] rounded-full border border-chimera-gold/50 px-4 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50">Keep for every scene with {scene.botName}</button>
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
                          <p className="text-base text-chimera-ink">{memory.content}</p>
                          <p className="mt-1 text-xs text-chimera-mute">{memory.conversationId ? 'This scene only' : `Every scene with ${scene.botName}`}</p>
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
        </section>
      )}

      {adultLocked && (
        <p role="note" className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          This character is rated Mature or NSFW. You can read this scene, but replies are paused until age verification opens. It is <Link to="/guardian" className="font-bold underline">coming soon</Link>.
        </p>
      )}

      <div className="flex-1 space-y-4 py-2" aria-live="polite">
        {messages.map((message) => {
          const mine = message.sender_id === user.id;
          const pinned = pinnedIds.includes(message.id);
          return (
            <div key={message.id} className={`group flex items-start gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[calc(100%-2.75rem)] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[17px] leading-relaxed ${mine ? 'bg-chimera-gold/15 text-chimera-ink' : 'border border-chimera-gold/20 bg-chimera-panel text-violet-50'} ${pinned ? 'ring-1 ring-chimera-gold/70' : ''}`}>
                {!mine && <span className="mb-1 block text-xs font-bold tracking-[0.12em] text-chimera-gold">{scene.botName.toUpperCase()}</span>}
                {message.content}
              </div>
              <button
                type="button"
                onClick={() => void togglePinned(message.id)}
                aria-pressed={pinned}
                disabled={!settingsReady}
                aria-label={pinned ? 'Unpin this message' : 'Pin this message'}
                title={pinned ? 'Unpin' : `Pin so ${scene.botName} never forgets it`}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${pinned ? 'text-chimera-gold' : 'text-chimera-mute/60 hover:text-chimera-gold'}`}
              >
                <Pin size={16} aria-hidden="true" className={pinned ? 'fill-current' : ''} />
              </button>
            </div>
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
      </div>

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
            disabled={adultLocked}
            placeholder={MODES.find((m) => m.id === mode)?.hint}
            className="min-h-[56px] flex-1 resize-none rounded-2xl border border-chimera-gold/35 bg-chimera-panel px-4 py-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/70 focus:border-chimera-gold disabled:opacity-50"
          />
          <button type="submit" disabled={busy || !draft.trim() || adultLocked} className="grid h-[56px] w-[56px] shrink-0 place-items-center rounded-full bg-chimera-gold text-[#1a1208] disabled:opacity-40" aria-label="Send">
            <Send size={22} aria-hidden="true" />
          </button>
        </form>
      </div>
      <div ref={endRef} />
    </div>
  );
}
