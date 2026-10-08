import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, Loader2, RefreshCw, Send } from 'lucide-react';
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

interface SceneInfo {
  botUserId: string;
  botName: string;
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
  const { showToast } = useToast();
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

  // Ask for the character's reply. Used for the first answer, retries and the opening.
  const askForReply = useCallback(
    async (botUserId: string, opening = false) => {
      if (!conversationId || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setReplyError(null);
      try {
        await requestCharacterReply({ conversationId, botUserId, isInitiation: opening });
        await loadMessages();
      } catch (error) {
        setReplyError(error instanceof Error ? error.message : 'The character could not answer right now.');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [conversationId, loadMessages],
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
          .select('id, type, memory_summary, canon_revision, conversation_participants(user_id)')
          .eq('id', conversationId)
          .maybeSingle();
        if (conversationError) throw conversationError;
        const participants = ((conversation?.conversation_participants ?? []) as Array<{ user_id: string }>);
        const botUserId = participants.find((p) => p.user_id !== user.id)?.user_id;
        if (!conversation || conversation.type !== 'dm' || !botUserId) {
          if (active) setLoadError('This scene is unavailable.');
          return;
        }
        const [{ data: character }, { data: profile }] = await Promise.all([
          supabase.from('ai_characters').select('name:chat_name, greeting, content_rating').eq('user_id', botUserId).maybeSingle(),
          supabase.from('profiles').select('display_name').eq('user_id', botUserId).maybeSingle(),
        ]);
        if (!active) return;
        const info: SceneInfo = {
          botUserId,
          botName: character?.name || profile?.display_name || 'Character',
          greeting: character?.greeting?.trim() || null,
          rating: character?.content_rating ?? null,
          canon: conversation.memory_summary ?? '',
          canonRevision: Number(conversation.canon_revision ?? 0),
        };
        setScene(info);
        setCanonDraft(info.canon);

        const rows = await loadMessages();
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
  }, [user, conversationId, loadMessages, askForReply]);

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
        <h1 className="min-w-0 flex-1 truncate font-serif text-2xl font-semibold">{scene.botName}</h1>
        <button
          type="button"
          onClick={() => setMemoryOpen((open) => !open)}
          aria-expanded={memoryOpen}
          aria-controls="scene-memory"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10"
        >
          <Brain size={18} aria-hidden="true" /> Memory
        </button>
      </header>

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
        </section>
      )}

      {adultLocked && (
        <p role="note" className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          This character is rated Mature or NSFW. You can read this scene, but replies are paused until your age is verified and adult content is turned on in the <Link to="/guardian" className="font-bold underline">Guardian&apos;s Library</Link>.
        </p>
      )}

      <div className="flex-1 space-y-4 py-2" aria-live="polite">
        {messages.map((message) => {
          const mine = message.sender_id === user.id;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[17px] leading-relaxed ${mine ? 'bg-chimera-gold/15 text-chimera-ink' : 'border border-chimera-gold/20 bg-chimera-panel text-violet-50'}`}>
                {!mine && <span className="mb-1 block text-xs font-bold tracking-[0.12em] text-chimera-gold">{scene.botName.toUpperCase()}</span>}
                {message.content}
              </div>
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
