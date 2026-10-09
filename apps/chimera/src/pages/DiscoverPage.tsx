import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdultContentAccess } from '../hooks/useAdultContentAccess';
import { ratingLabel } from '../lib/ratings';

interface CharacterRow {
  id: string;
  name: string | null;
  short_description: string | null;
  long_description: string | null;
  category: string | null;
  tags: string[] | null;
  content_rating: string | null;
  avatar_url: string | null;
}

const GRADIENTS = [
  'from-violet-700 to-chimera-rose',
  'from-sky-700 to-violet-700',
  'from-amber-700 to-chimera-gold',
  'from-orange-700 to-chimera-gold',
  'from-indigo-900 to-chimera-blue',
  'from-teal-700 to-chimera-rose',
];

export default function DiscoverPage() {
  const { allowed: adultAccess, loading: accessLoading } = useAdultContentAccess();
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    if (accessLoading) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    let request = supabase
      .from('ai_characters')
      .select('id, name:chat_name, short_description, long_description, category, tags, content_rating, avatar_url')
      .eq('visibility', 'public')
      .eq('status', 'published');
    // Mature / NSFW characters are listed only for verified adults who opted in.
    if (!adultAccess) request = request.or('content_rating.is.null,content_rating.eq.SFW');
    request
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setFailed(true);
          setCharacters([]);
        } else {
          setCharacters((data as CharacterRow[]) ?? []);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adultAccess, accessLoading]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    characters.forEach((c) => c.category && set.add(c.category));
    return ['All', ...Array.from(set).sort()];
  }, [characters]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return characters.filter((c) => {
      if (category !== 'All' && c.category !== category) return false;
      if (!needle) return true;
      return [c.name, c.short_description, c.category, ...(c.tags ?? [])].some((v) => v?.toLowerCase().includes(needle));
    });
  }, [characters, query, category]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8">
      <section className="text-center">
        <p className="mb-4 text-sm font-bold tracking-[0.26em] text-chimera-gold">ROLEPLAY DISCOVERY</p>
        <h1 className="font-serif text-5xl font-semibold leading-[1.05] sm:text-7xl">Find a doorway into someone else&apos;s world.</h1>
        <div className="mx-auto mt-9 flex h-[58px] max-w-2xl items-center gap-3 rounded-full border border-chimera-gold/45 bg-chimera-panel/90 px-5">
          <Search size={22} className="text-chimera-gold" aria-hidden="true" />
          <label htmlFor="discover-search" className="sr-only">Search characters</label>
          <input
            id="discover-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search characters by name, mood or genre"
            className="flex-1 bg-transparent text-lg text-chimera-ink outline-none placeholder:text-chimera-mute/70"
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Categories">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`min-h-[40px] rounded-full border px-5 text-[15px] ${category === c ? 'border-chimera-gold bg-chimera-gold font-bold text-[#1a1208]' : 'border-chimera-gold/35 text-violet-100/90 hover:border-chimera-gold'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {!adultAccess && !accessLoading && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-chimera-blue/35 bg-chimera-blue/10 px-5 py-4">
          <Lock size={22} className="text-chimera-blue" aria-hidden="true" />
          <p className="min-w-[260px] flex-1 text-base text-blue-50">Mature and Adult stories stay hidden until age verification opens. It is coming soon.</p>
          <Link to="/guardian" className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-blue px-5 text-sm font-bold text-blue-50 hover:bg-chimera-blue/15">Learn more</Link>
        </div>
      )}

      <section className="mt-8" aria-live="polite">
        {loading || accessLoading ? (
          <p className="py-16 text-center text-chimera-mute">Opening the doorways…</p>
        ) : failed ? (
          <p className="py-16 text-center text-chimera-mute">We could not load characters right now. Please try again in a moment.</p>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-chimera-mute">{characters.length === 0 ? 'No public characters yet.' : 'No character matches your search.'}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c, index) => (
              <li key={c.id} className="flex flex-col gap-4 rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-6 transition hover:border-chimera-gold/60">
                <div className="flex items-center gap-4">
                  <span className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} font-serif text-2xl text-white`} aria-hidden="true">
                    {(c.name ?? '?').slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-serif text-2xl font-semibold leading-tight">{c.name ?? 'Untitled character'}</h2>
                    {c.category && <span className="text-sm text-chimera-mute">{c.category}</span>}
                  </div>
                </div>
                <p className="leading-relaxed text-violet-100/85">{c.short_description || c.long_description || 'A character waiting for a story to begin.'}</p>
                <div className="flex flex-wrap gap-2">
                  {(c.tags ?? []).slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[13px] text-violet-100/80">{tag}</span>
                  ))}
                  <span className="rounded-full border border-chimera-mint/50 px-3 py-1 text-xs font-bold tracking-[0.1em] text-chimera-mint">{ratingLabel(c.content_rating)}</span>
                </div>
                <Link to={`/characters/${c.id}`} className="mt-auto inline-flex min-h-[44px] items-center justify-center rounded-full bg-chimera-gold px-5 text-[15px] font-bold text-[#1a1208] hover:brightness-110">Enter their story</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
