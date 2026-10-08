import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { STATUS_LABEL, type StoryStatus } from '../lib/stories';

interface Story {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  genre: string | null;
  tags: string[] | null;
  status: StoryStatus | null;
  visibility: string;
  author: { display_name: string | null } | null;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  status: 'draft' | 'published';
}

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    (async () => {
      const [{ data: storyRow }, { data: chapterRows }] = await Promise.all([
        supabase
          .from('stories')
          .select('id, user_id, title, summary, genre, tags, status, visibility, author:profiles!stories_user_id_fkey(display_name)')
          .eq('id', id)
          .maybeSingle(),
        supabase.from('story_chapters').select('id, title, chapter_number, status').eq('story_id', id).order('chapter_number', { ascending: true }),
      ]);
      if (!active) return;
      setStory((storyRow as unknown as Story | null) ?? null);
      setChapters((chapterRows ?? []) as Chapter[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className="px-5 py-24 text-center text-chimera-mute">Opening the story…</p>;

  if (!story) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Story not found</h1>
        <p className="mt-3 text-chimera-mute">It may have been removed, or it may be private.</p>
        <Link to="/library" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Back to the Library</Link>
      </div>
    );
  }

  const isOwner = !!user && story.user_id === user.id;
  const readable = isOwner ? chapters : chapters.filter((c) => c.status === 'published');

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to={isOwner ? '/workspace' : '/library'} className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> {isOwner ? "Writer's Desk" : 'Library'}
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">{(story.genre ?? 'STORY').toUpperCase()}</p>
      <h1 className="font-serif text-5xl font-semibold leading-[1.05]">{story.title}</h1>
      <p className="mt-3 text-chimera-mute">by {story.author?.display_name ?? 'an author'}{story.status ? ` · ${STATUS_LABEL[story.status] ?? story.status}` : ''}</p>
      {story.summary && <p className="mt-5 whitespace-pre-wrap font-serif text-xl leading-relaxed text-violet-100/90">{story.summary}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {(story.tags ?? []).map((tag) => <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-sm text-violet-100/80">{tag}</span>)}
        {isOwner && story.visibility !== 'public' && <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-violet-100/80">{story.visibility === 'private' ? 'Private' : 'Unlisted'}</span>}
      </div>
      {isOwner && <div className="mt-5"><Link to={`/stories/${story.id}/edit`} className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Edit story</Link></div>}

      <section className="mt-10" aria-labelledby="toc-h">
        <h2 id="toc-h" className="font-serif text-3xl font-semibold text-chimera-gold">Chapters</h2>
        {readable.length === 0 ? (
          <p className="mt-4 text-chimera-mute">No chapter has been published yet.</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-2">
            {readable.map((chapter) => (
              <li key={chapter.id}>
                <Link to={`/stories/${story.id}/chapters/${chapter.id}`} className="flex items-center gap-3 rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4 hover:border-chimera-gold/60">
                  <span className="w-8 text-chimera-mute">{chapter.chapter_number}</span>
                  <span className="flex-1 font-serif text-xl">{chapter.title}</span>
                  {chapter.status === 'draft' && <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold tracking-[0.1em] text-violet-100/80">DRAFT</span>}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
