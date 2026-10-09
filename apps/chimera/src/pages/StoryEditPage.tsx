import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useIsFounder } from '../hooks/useIsFounder';
import { StoryDetailsForm } from '../components/StoryDetailsForm';
import { saveFailureMessage, storyRow, validateStory, type StoryForm, type StoryStatus } from '../lib/stories';
import type { Visibility } from '../lib/characters';

interface ChapterRow {
  id: string;
  title: string;
  chapter_number: number;
  status: 'draft' | 'published';
}

export default function StoryEditPage() {
  const { id: storyId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isFounder } = useIsFounder();
  const [form, setForm] = useState<StoryForm | null>(null);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadChapters = useCallback(async () => {
    const { data, error } = await supabase
      .from('story_chapters')
      .select('id, title, chapter_number, status')
      .eq('story_id', storyId!)
      .order('chapter_number', { ascending: true });
    if (error) throw error;
    setChapters((data ?? []) as ChapterRow[]);
  }, [storyId]);

  useEffect(() => {
    if (!user || !storyId) return;
    let active = true;
    (async () => {
      const { data: story, error } = await supabase.from('stories').select('title, summary, genre, tags, visibility, status').eq('id', storyId).eq('user_id', user.id).maybeSingle();
      if (!active) return;
      if (error || !story) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setForm({
        title: story.title ?? '',
        summary: story.summary ?? '',
        genre: story.genre ?? 'General',
        tags: Array.isArray(story.tags) ? story.tags.join(', ') : '',
        visibility: (story.visibility as Visibility) ?? 'private',
        status: (story.status as StoryStatus) ?? 'ongoing',
      });
      try {
        await loadChapters();
      } catch {
        setProblem('We could not load the chapters. Please reload the page.');
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, storyId, loadChapters]);

  if (loading) return <p className="px-5 py-24 text-center text-chimera-mute">Opening your story…</p>;

  if (notFound || !form) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Story not found</h1>
        <p className="mt-3 text-chimera-mute">Only the author can edit a story.</p>
        <Link to="/workspace" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Writer&apos;s Desk</Link>
      </div>
    );
  }

  const saveDetails = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const message = validateStory(form);
    setProblem(message);
    if (message) return;
    setSaving(true);
    const { error } = await supabase.from('stories').update(storyRow(form)).eq('id', storyId!).eq('user_id', user!.id);
    setSaving(false);
    if (error) {
      setProblem(saveFailureMessage(error, 'We could not save the details. Your text is still here, please try again.'));
      return;
    }
    setDirty(false);
    showToast('Story details saved.', 'success');
  };

  const addChapter = async () => {
    if (adding) return;
    setAdding(true);
    const next = chapters.reduce((max, c) => Math.max(max, c.chapter_number), 0) + 1;
    const { data, error } = await supabase
      .from('story_chapters')
      .insert({ story_id: storyId!, title: `Chapter ${next}`, content: '', chapter_number: next, status: 'draft' })
      .select('id')
      .single();
    setAdding(false);
    if (error || !data?.id) {
      showToast('We could not add a chapter. Please try again.', 'error');
      return;
    }
    navigate(`/stories/${storyId}/chapters/${data.id}/edit`);
  };

  const deleteChapter = async (chapter: ChapterRow) => {
    if (!window.confirm(`Delete "${chapter.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('story_chapters').delete().eq('id', chapter.id);
    if (error) {
      showToast('We could not delete that chapter.', 'error');
      return;
    }
    setChapters((current) => current.filter((c) => c.id !== chapter.id));
  };

  const deleteStory = async () => {
    if (!window.confirm(`Delete "${form.title}" and all its chapters? This cannot be undone.`)) return;
    const { error } = await supabase.from('stories').delete().eq('id', storyId!).eq('user_id', user!.id);
    if (error) {
      showToast('We could not delete this story.', 'error');
      return;
    }
    navigate('/workspace');
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/workspace" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Writer&apos;s Desk
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">YOUR STORY</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">{form.title || 'Untitled story'}</h1>
      <div className="mt-3"><Link to={`/stories/${storyId}`} className="text-chimera-gold underline">Read it as a reader</Link></div>

      <section className="mt-8" aria-labelledby="chapters-h">
        <div className="flex items-center justify-between gap-3">
          <h2 id="chapters-h" className="font-serif text-3xl font-semibold text-chimera-gold">Chapters</h2>
          <button type="button" onClick={() => void addChapter()} disabled={adding} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
            <Plus size={16} aria-hidden="true" /> {adding ? 'Adding…' : 'Add chapter'}
          </button>
        </div>
        {chapters.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-6 text-violet-100/85">No chapters yet. Add the first one and start writing.</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-2">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-3 pl-4">
                <span className="w-8 text-chimera-mute">{chapter.chapter_number}</span>
                <span className="min-w-0 flex-1 truncate font-serif text-xl">{chapter.title}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-[0.1em] ${chapter.status === 'published' ? 'border-chimera-mint/50 text-chimera-mint' : 'border-white/20 text-violet-100/80'}`}>{chapter.status === 'published' ? 'PUBLISHED' : 'DRAFT'}</span>
                <Link to={`/stories/${storyId}/chapters/${chapter.id}/edit`} className="inline-flex min-h-[40px] items-center rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Write</Link>
                <button type="button" onClick={() => void deleteChapter(chapter)} className="min-h-[40px] rounded-full px-3 text-sm text-chimera-mute hover:text-chimera-rose" aria-label={`Delete ${chapter.title}`}>Delete</button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <form onSubmit={(e) => void saveDetails(e)} className="mt-12 space-y-6" noValidate aria-labelledby="details-h">
        <h2 id="details-h" className="font-serif text-3xl font-semibold text-chimera-gold">Details</h2>
        <StoryDetailsForm form={form} setForm={(update) => setForm((current) => (typeof update === 'function' ? update(current as StoryForm) : update))} isFounder={isFounder} onEdit={() => { setDirty(true); setProblem(null); }} />
        {problem && <p role="alert" className="rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-sm text-red-100">{problem}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving || !dirty} className="inline-flex min-h-[52px] items-center rounded-full bg-chimera-gold px-7 text-base font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">{saving ? 'Saving…' : 'Save details'}</button>
          <button type="button" onClick={() => void deleteStory()} className="min-h-[44px] rounded-full px-4 text-sm text-chimera-mute hover:text-chimera-rose">Delete this story</button>
        </div>
      </form>
    </div>
  );
}
