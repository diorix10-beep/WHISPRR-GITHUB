import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoryCard {
  id: string;
  title: string;
  summary: string | null;
  genre: string | null;
  tags: string[] | null;
  author: { display_name: string | null } | null;
  story_chapters: Array<{ id: string; status: string }>;
}

export default function LibraryPage() {
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');

  useEffect(() => {
    let active = true;
    supabase
      .from('stories')
      // The inner join and the filter run in the database, before the limit: a story with no
      // published chapter never uses up one of the 60 places.
      .select('id, title, summary, genre, tags, author:profiles!stories_user_id_fkey(display_name), story_chapters!inner(id, status)')
      .eq('visibility', 'public')
      .eq('story_chapters.status', 'published')
      .order('updated_at', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setFailed(true);
        } else {
          setStories((data ?? []) as unknown as StoryCard[]);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const genres = useMemo(() => ['All', ...Array.from(new Set(stories.map((s) => s.genre).filter((g): g is string => !!g))).sort()], [stories]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (genre !== 'All' && s.genre !== genre) return false;
      if (!needle) return true;
      return [s.title, s.summary, s.genre, s.author?.display_name, ...(s.tags ?? [])].some((v) => v?.toLowerCase().includes(needle));
    });
  }, [stories, query, genre]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8">
      <section className="text-center">
        <p className="mb-4 text-sm font-bold tracking-[0.26em] text-chimera-gold">STORY LIBRARY</p>
        <h1 className="font-serif text-5xl font-semibold leading-[1.05] sm:text-7xl">Stories worth getting lost in.</h1>
        <div className="mx-auto mt-9 flex h-[58px] max-w-2xl items-center gap-3 rounded-full border border-chimera-gold/45 bg-chimera-panel/90 px-5">
          <Search size={22} className="text-chimera-gold" aria-hidden="true" />
          <label htmlFor="library-search" className="sr-only">Search stories</label>
          <input id="library-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, author or genre" className="flex-1 bg-transparent text-lg text-chimera-ink outline-none placeholder:text-chimera-mute/70" />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Genres">
          {genres.map((g) => (
            <button key={g} type="button" aria-pressed={genre === g} onClick={() => setGenre(g)} className={`min-h-[40px] rounded-full border px-5 text-[15px] ${genre === g ? 'border-chimera-gold bg-chimera-gold font-bold text-[#1a1208]' : 'border-chimera-gold/35 text-violet-100/90 hover:border-chimera-gold'}`}>{g}</button>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-live="polite">
        {loading ? (
          <p className="py-16 text-center text-chimera-mute">Opening the shelves…</p>
        ) : failed ? (
          <p className="py-16 text-center text-chimera-mute">We could not load the library right now. Please try again in a moment.</p>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-chimera-mute">{stories.length === 0 ? 'No stories have been published yet.' : 'No story matches your search.'}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((story) => (
              <li key={story.id} className="flex flex-col gap-3 rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-6 transition hover:border-chimera-gold/60">
                <h2 className="font-serif text-2xl font-semibold leading-tight">{story.title}</h2>
                <p className="text-sm text-chimera-mute">by {story.author?.display_name ?? 'an author'}{story.genre ? ` · ${story.genre}` : ''}</p>
                <p className="line-clamp-4 leading-relaxed text-violet-100/85">{story.summary || 'A story waiting to be read.'}</p>
                <div className="flex flex-wrap gap-2">
                  {(story.tags ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[13px] text-violet-100/80">{tag}</span>)}
                </div>
                <Link to={`/stories/${story.id}`} className="mt-auto inline-flex min-h-[44px] items-center justify-center rounded-full bg-chimera-gold px-5 text-[15px] font-bold text-[#1a1208] hover:brightness-110">Read</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
