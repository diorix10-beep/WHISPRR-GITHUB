import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { countWords, readingMinutes, splitParagraphs } from '../lib/stories';

interface Chapter {
  id: string;
  title: string;
  content: string;
  chapter_number: number;
  status: 'draft' | 'published';
}

interface Neighbour {
  id: string;
  title: string;
  chapter_number: number;
}

export default function ChapterReaderPage() {
  const { id: storyId, chapterId } = useParams<{ id: string; chapterId: string }>();
  const { user } = useAuth();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [all, setAll] = useState<Neighbour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storyId || !chapterId) return;
    let active = true;
    setLoading(true);
    (async () => {
      const [{ data: chapterRow }, { data: storyRow }, { data: list }] = await Promise.all([
        supabase.from('story_chapters').select('id, title, content, chapter_number, status').eq('id', chapterId).eq('story_id', storyId).maybeSingle(),
        supabase.from('stories').select('title, user_id').eq('id', storyId).maybeSingle(),
        supabase.from('story_chapters').select('id, title, chapter_number').eq('story_id', storyId).order('chapter_number', { ascending: true }),
      ]);
      if (!active) return;
      setChapter((chapterRow as Chapter | null) ?? null);
      setStoryTitle(storyRow?.title ?? '');
      setOwnerId(storyRow?.user_id ?? null);
      setAll((list ?? []) as Neighbour[]);
      setLoading(false);
      window.scrollTo?.({ top: 0 });
    })();
    return () => {
      active = false;
    };
  }, [storyId, chapterId]);

  if (loading) return <p className="px-5 py-24 text-center text-chimera-mute">Turning the page…</p>;

  if (!chapter) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Chapter not found</h1>
        <p className="mt-3 text-chimera-mute">It may not be published, or it may have been removed.</p>
        <Link to={storyId ? `/stories/${storyId}` : '/library'} className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Back to the story</Link>
      </div>
    );
  }

  const isOwner = !!user && ownerId === user.id;
  const index = all.findIndex((c) => c.id === chapter.id);
  const previous = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const words = countWords(chapter.content);
  const paragraphs = splitParagraphs(chapter.content);

  return (
    <article className="mx-auto max-w-2xl px-5 pb-16 pt-8 sm:px-8">
      <Link to={`/stories/${storyId}`} className="mb-6 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> {storyTitle || 'Back to the story'}
      </Link>
      {chapter.status === 'draft' && isOwner && (
        <p role="note" className="mb-4 rounded-xl border border-chimera-gold/30 bg-chimera-gold/10 px-4 py-3 text-sm text-chimera-gold">This chapter is a draft. Only you can see it.</p>
      )}
      <p className="text-sm font-bold tracking-[0.24em] text-chimera-gold">CHAPTER {chapter.chapter_number}</p>
      <h1 className="mt-2 font-serif text-5xl font-semibold leading-tight">{chapter.title}</h1>
      <p className="mt-2 text-sm text-chimera-mute">{words} {words === 1 ? 'word' : 'words'} · about {readingMinutes(words)} min</p>

      <div className="mt-8 space-y-6 font-serif text-[21px] leading-[1.75] text-[#eadfc9]">
        {paragraphs.length === 0 ? <p className="text-chimera-mute">This chapter is empty so far.</p> : paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
      </div>

      <nav className="mt-12 flex items-center justify-between gap-4 border-t border-chimera-gold/20 pt-6" aria-label="Chapters">
        {previous ? <Link to={`/stories/${storyId}/chapters/${previous.id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-5 font-bold hover:bg-chimera-gold/10"><ArrowLeft size={16} aria-hidden="true" /> Previous</Link> : <span />}
        {next ? <Link to={`/stories/${storyId}/chapters/${next.id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-chimera-gold px-5 font-bold text-[#1a1208] hover:brightness-110">Next <ArrowRight size={16} aria-hidden="true" /></Link> : <span />}
      </nav>
    </article>
  );
}
