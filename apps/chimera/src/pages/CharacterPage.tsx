import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isAdultRating, useAdultContentAccess } from '../hooks/useAdultContentAccess';
import { useAuth } from '../contexts/AuthContext';
import { ratingLabel } from '../lib/ratings';

interface CharacterDetail {
  id: string;
  name: string | null;
  short_description: string | null;
  long_description: string | null;
  scenario: string | null;
  greeting: string | null;
  personality: string | null;
  category: string | null;
  tags: string[] | null;
  content_rating: string | null;
}

export default function CharacterPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { allowed: adultAccess, loading: accessLoading } = useAdultContentAccess();
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || accessLoading) return;
    let active = true;
    setLoading(true);
    setCharacter(null);
    let request = supabase
      .from('ai_characters')
      .select('id, name, short_description, long_description, scenario, greeting, personality, category, tags, content_rating')
      .eq('id', id);
    // UI defence only: RLS enforces the same rule for direct Data API requests.
    if (!adultAccess) request = request.or('content_rating.is.null,content_rating.eq.SFW');
    request.maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setCharacter((data as CharacterDetail | null) ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user?.id, adultAccess, accessLoading]);

  if (loading || accessLoading) return <p className="px-5 py-24 text-center text-chimera-mute">Opening the story…</p>;

  if (!character || (isAdultRating(character.content_rating) && !adultAccess)) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Character not found</h1>
        <p className="mt-3 text-chimera-mute">This character may have been removed, or may not be available to you.</p>
        <Link to="/discover" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Back to discovery</Link>
      </div>
    );
  }

  const name = character.name ?? 'Unnamed character';

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:px-8">
      <Link to="/discover" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Back to discovery
      </Link>

      <article className="flex flex-wrap overflow-hidden rounded-[22px] border border-chimera-gold/20 bg-chimera-panel">
        <div className="grid min-h-[320px] flex-[0_1_360px] place-items-center bg-gradient-to-br from-[#2a1d4a] via-violet-700 to-chimera-rose" aria-hidden="true">
          <span className="font-serif text-[140px] leading-none text-white/90">{name.slice(0, 1).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-[1_1_480px] p-8 sm:p-11">
          <p className="mb-3 text-xs font-bold tracking-[0.24em] text-chimera-gold">CHARACTER PROFILE</p>
          <h1 className="font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">{name}</h1>
          <p className="mt-4 text-lg text-violet-100/85">{character.short_description || character.long_description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {character.category && <span className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-violet-100/80">{character.category}</span>}
            {(character.tags ?? []).map((tag) => <span key={tag} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-violet-100/80">{tag}</span>)}
            <span className="rounded-full border border-chimera-mint/50 px-3 py-1.5 text-xs font-bold tracking-[0.1em] text-chimera-mint">{ratingLabel(character.content_rating)}</span>
          </div>

          <section className="mt-7 rounded-2xl border border-chimera-gold/20 bg-chimera-panel2 p-6">
            <p className="mb-2 text-xs font-bold tracking-[0.22em] text-chimera-rose">THE OPENING SCENE</p>
            <p className="font-serif text-2xl leading-snug">{character.scenario || 'The scene is waiting for you.'}</p>
            {character.greeting && <p className="mt-3 font-serif text-xl italic leading-relaxed text-[#e6d9c0]">{character.greeting}</p>}
          </section>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" disabled className="inline-flex min-h-[52px] cursor-not-allowed items-center rounded-full bg-chimera-gold/40 px-7 text-base font-bold text-[#1a1208]/70" aria-describedby="scene-note">Begin a scene</button>
            <p id="scene-note" className="text-sm text-chimera-mute">Scenes are the next thing we are building.</p>
          </div>
        </div>
      </article>

      {character.personality && (
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-7">
            <h2 className="mb-2 font-serif text-3xl font-semibold text-chimera-gold">Personality</h2>
            <p className="text-lg leading-relaxed text-violet-100/85">{character.personality}</p>
          </div>
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-7">
            <h2 className="mb-2 font-serif text-3xl font-semibold text-chimera-gold">Before you enter</h2>
            <p className="text-lg leading-relaxed text-violet-100/85">Replies are written by an AI. Scenes will remember what happens, and you will be able to view, edit or delete that memory at any time.</p>
          </div>
        </section>
      )}
    </div>
  );
}
