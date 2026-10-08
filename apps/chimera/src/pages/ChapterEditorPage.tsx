import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { clearSavedDraft, draftKey, readDraft, writeDraft } from '../lib/draftJournal';
import { STORY_LIMITS, countWords, readingMinutes } from '../lib/stories';

interface ChapterText {
  title: string;
  content: string;
}

interface Snapshot extends ChapterText {
  updatedAt: string;
}

type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';

const AUTOSAVE_MS = 1500;

const STATE_LABEL: Record<SaveState, string> = {
  saved: 'All changes saved',
  dirty: 'Saving soon… (kept safe on this device)',
  saving: 'Saving…',
  error: 'Could not save. Your text is kept on this device.',
  conflict: 'This chapter changed somewhere else.',
};

export default function ChapterEditorPage() {
  const { id: storyId, chapterId } = useParams<{ id: string; chapterId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [text, setText] = useState<ChapterText>({ title: '', content: '' });
  const [published, setPublished] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [recovered, setRecovered] = useState<ChapterText | null>(null);
  const [publishing, setPublishing] = useState(false);

  const snapshot = useRef<Snapshot | null>(null);
  const latest = useRef<ChapterText>(text);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const stopped = useRef(false);
  const userId = user?.id ?? null;
  const saveRef = useRef<() => Promise<boolean>>(async () => false);
  const key = userId && chapterId ? draftKey(userId, 'chapter', chapterId) : null;

  const save = useCallback(async (): Promise<boolean> => {
    if (!chapterId || !snapshot.current || stopped.current) return false;
    if (saving.current) return false;
    const payload = { ...latest.current };
    const base = snapshot.current;
    if (payload.title === base.title && payload.content === base.content) {
      setSaveState('saved');
      return true;
    }
    saving.current = true;
    setSaveState('saving');
    // Only write if nobody changed the chapter since we loaded it: no silent overwrite.
    const { data, error } = await supabase
      .from('story_chapters')
      .update({ title: payload.title.trim() || 'Untitled chapter', content: payload.content })
      .eq('id', chapterId)
      .eq('updated_at', base.updatedAt)
      .select('updated_at')
      .maybeSingle();
    saving.current = false;
    if (error) {
      setSaveState('error');
      return false;
    }
    if (!data) {
      stopped.current = true;
      setSaveState('conflict');
      return false;
    }
    snapshot.current = { ...payload, updatedAt: data.updated_at as string };
    if (key) clearSavedDraft(key, payload);
    const typedMore = latest.current.title !== payload.title || latest.current.content !== payload.content;
    if (typedMore) {
      setSaveState('dirty');
      timer.current = setTimeout(() => void save(), AUTOSAVE_MS);
    } else {
      setSaveState('saved');
    }
    return true;
  }, [chapterId, key]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!userId || !chapterId || !storyId) return;
    let active = true;
    stopped.current = false;
    (async () => {
      const [{ data: chapter, error }, { data: story }] = await Promise.all([
        supabase.from('story_chapters').select('title, content, status, updated_at').eq('id', chapterId).eq('story_id', storyId).maybeSingle(),
        supabase.from('stories').select('title').eq('id', storyId).eq('user_id', userId).maybeSingle(),
      ]);
      if (!active) return;
      if (error || !chapter || !story) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const server: ChapterText = { title: chapter.title ?? '', content: chapter.content ?? '' };
      snapshot.current = { ...server, updatedAt: chapter.updated_at as string };
      latest.current = server;
      setText(server);
      setStoryTitle(story.title ?? '');
      setPublished(chapter.status === 'published');
      const draft = readDraft<ChapterText>(draftKey(userId, 'chapter', chapterId));
      if (draft && (draft.value.title !== server.title || draft.value.content !== server.content)) setRecovered(draft.value);
      setLoading(false);
    })();
    return () => {
      active = false;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        void saveRef.current();
      }
    };
  }, [userId, chapterId, storyId]);

  // A leftover timer or an unsaved page must not lose text silently.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (saveState === 'dirty' || saveState === 'saving' || saveState === 'error') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saveState]);

  const change = (next: ChapterText) => {
    setText(next);
    latest.current = next;
    if (key) writeDraft(key, next, snapshot.current?.updatedAt);
    if (stopped.current) return;
    setSaveState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), AUTOSAVE_MS);
  };

  const restore = () => {
    if (!recovered) return;
    change(recovered);
    setRecovered(null);
  };

  const discardRecovered = () => {
    if (key && recovered) clearSavedDraft(key, recovered);
    setRecovered(null);
  };

  const reloadLatest = () => window.location.reload();

  const setPublication = async (publish: boolean) => {
    if (publishing || !chapterId) return;
    setPublishing(true);
    if (timer.current) clearTimeout(timer.current);
    while (saving.current) await new Promise((resolve) => setTimeout(resolve, 100));
    let ok = await save();
    if (!ok && snapshot.current && latest.current.title === snapshot.current.title && latest.current.content === snapshot.current.content) ok = true;
    if (!ok || stopped.current) {
      setPublishing(false);
      showToast('Save your changes first, then try again.', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('story_chapters')
      .update({ status: publish ? 'published' : 'draft', published_at: publish ? new Date().toISOString() : null })
      .eq('id', chapterId)
      .eq('updated_at', snapshot.current!.updatedAt)
      .select('updated_at')
      .maybeSingle();
    setPublishing(false);
    if (error || !data) {
      showToast('We could not change the publication. Reload the chapter and try again.', 'error');
      return;
    }
    snapshot.current = { ...snapshot.current!, updatedAt: data.updated_at as string };
    setPublished(publish);
    showToast(publish ? 'Chapter published.' : 'Chapter moved back to drafts.', 'success');
  };

  if (loading) return <p className="px-5 py-24 text-center text-chimera-mute">Opening the chapter…</p>;

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Chapter not found</h1>
        <p className="mt-3 text-chimera-mute">Only the author can edit a chapter.</p>
        <Link to="/workspace" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Writer&apos;s Desk</Link>
      </div>
    );
  }

  const words = countWords(text.content);
  const stateColor = saveState === 'saved' ? 'text-chimera-mint' : saveState === 'error' || saveState === 'conflict' ? 'text-chimera-rose' : 'text-chimera-mute';

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:px-8">
      <Link to={`/stories/${storyId}/edit`} className="mb-4 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> {storyTitle || 'Back to the story'}
      </Link>

      {recovered && (
        <div role="alert" className="mb-4 rounded-2xl border border-chimera-gold/40 bg-chimera-gold/10 p-4">
          <p className="font-bold">We found text saved on this device that is not in the chapter yet.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={restore} className="min-h-[40px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208]">Restore it</button>
            <button type="button" onClick={discardRecovered} className="min-h-[40px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Discard it</button>
          </div>
        </div>
      )}

      {saveState === 'conflict' && (
        <div role="alert" className="mb-4 rounded-2xl border border-chimera-rose/40 bg-chimera-rose/10 p-4">
          <p className="font-bold">This chapter was changed in another tab or device.</p>
          <p className="mt-1 text-sm text-chimera-mute">We stopped saving so nothing is overwritten. Your text is still on this device. Reload to see the latest version.</p>
          <button type="button" onClick={reloadLatest} className="mt-3 min-h-[40px] rounded-full border border-chimera-rose/50 px-5 text-sm font-bold hover:bg-chimera-rose/15">Reload latest</button>
        </div>
      )}

      <label htmlFor="chapter-title" className="sr-only">Chapter title</label>
      <input
        id="chapter-title"
        value={text.title}
        onChange={(e) => change({ ...text, title: e.target.value })}
        maxLength={STORY_LIMITS.chapterTitle}
        placeholder="Chapter title"
        className="w-full bg-transparent font-serif text-4xl font-semibold outline-none placeholder:text-chimera-mute/50"
      />
      <label htmlFor="chapter-body" className="sr-only">Chapter text</label>
      <textarea
        id="chapter-body"
        value={text.content}
        onChange={(e) => change({ ...text, content: e.target.value })}
        maxLength={STORY_LIMITS.chapterContent}
        placeholder="Once upon a time…"
        className="mt-4 min-h-[60vh] w-full resize-y rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-5 font-serif text-xl leading-relaxed text-chimera-ink outline-none placeholder:text-chimera-mute/50 focus:border-chimera-gold"
      />

      <div className="sticky bottom-0 -mx-1 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 bg-chimera-bg/95 px-1 py-3 backdrop-blur">
        <p className={`text-sm ${stateColor}`} role="status">{STATE_LABEL[saveState]}</p>
        <p className="text-sm text-chimera-mute">{words} {words === 1 ? 'word' : 'words'} · about {readingMinutes(words)} min</p>
        <div className="ml-auto flex items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-[0.1em] ${published ? 'border-chimera-mint/50 text-chimera-mint' : 'border-white/20 text-violet-100/80'}`}>{published ? 'PUBLISHED' : 'DRAFT'}</span>
          <button type="button" onClick={() => void setPublication(!published)} disabled={publishing || saveState === 'conflict'} className="min-h-[44px] rounded-full bg-chimera-gold px-6 text-sm font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
            {publishing ? 'Working…' : published ? 'Move to drafts' : 'Publish chapter'}
          </button>
        </div>
      </div>
    </div>
  );
}
