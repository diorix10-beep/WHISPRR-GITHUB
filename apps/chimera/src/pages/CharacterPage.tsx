import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isAdultRating, useAdultContentAccess } from '../hooks/useAdultContentAccess';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ratingLabel } from '../lib/ratings';
import { loadMyPersonas, type PersonaSummary } from '../lib/personas';

interface CharacterDetail {
  id: string;
  user_id: string;
  creator_id: string | null;
  visibility: string | null;
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const { allowed: adultAccess, loading: accessLoading } = useAdultContentAccess();
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [personaChoice, setPersonaChoice] = useState<string>('none');

  useEffect(() => {
    if (!id || accessLoading) return;
    let active = true;
    setLoading(true);
    setCharacter(null);
    let request = supabase
      .from('ai_characters')
      .select('id, user_id, creator_id, visibility, name:chat_name, short_description, long_description, scenario, greeting, personality, category, tags, content_rating')
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

  useEffect(() => {
    if (!user) return;
    let active = true;
    loadMyPersonas(user.id)
      .then((list) => {
        if (!active) return;
        setPersonas(list);
        setPersonaChoice(list.find((p) => p.is_default)?.id ?? 'none');
      })
      .catch(() => undefined); // The picker is optional: starting a scene still works without it.
    return () => {
      active = false;
    };
  }, [user]);

  const beginScene = async () => {
    if (!character || starting) return;
    if (!user) {
      navigate('/auth', { state: { from: `/characters/${character.id}` } });
      return;
    }
    setStarting(true);
    const { data, error } = await supabase.rpc('create_chimera_scene', { p_bot_ids: [character.user_id] });
    setStarting(false);
    const scene = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
    if (error || !scene?.id) {
      showToast('We could not start this scene. Please try again.', 'error');
      return;
    }
    if (personas.length > 0) {
      const { error: personaError } = await supabase.rpc('set_chimera_scene_persona', {
        p_conversation_id: scene.id,
        p_persona_id: personaChoice === 'none' ? null : personaChoice,
      });
      if (personaError) showToast('The scene started, but we could not set your persona. You can change it before your first message.', 'info');
    }
    navigate(`/chats/${scene.id}`);
  };

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
  const isOwner = !!user && character.creator_id === user.id;

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
            {isOwner && character.visibility && character.visibility !== 'public' && <span className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-violet-100/80">{character.visibility === 'private' ? 'Private' : 'Unlisted'}</span>}
          </div>

          <section className="mt-7 rounded-2xl border border-chimera-gold/20 bg-chimera-panel2 p-6">
            <p className="mb-2 text-xs font-bold tracking-[0.22em] text-chimera-rose">THE OPENING SCENE</p>
            <p className="font-serif text-2xl leading-snug">{character.scenario || 'The scene is waiting for you.'}</p>
            {character.greeting && <p className="mt-3 font-serif text-xl italic leading-relaxed text-[#e6d9c0]">{character.greeting}</p>}
          </section>

          {user && personas.length > 0 && (
            <div className="mt-6 max-w-sm">
              <label htmlFor="scene-persona" className="text-sm font-bold tracking-[0.12em] text-chimera-gold">PLAY AS</label>
              <select id="scene-persona" value={personaChoice} onChange={(e) => setPersonaChoice(e.target.value)} className="mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none focus:border-chimera-gold">
                {personas.map((p) => <option key={p.id} value={p.id}>{p.name}{p.is_default ? ' (default)' : ''}</option>)}
                <option value="none">Myself, no persona</option>
              </select>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => void beginScene()} disabled={starting} className="inline-flex min-h-[52px] items-center rounded-full bg-chimera-gold px-7 text-base font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              {starting ? 'Starting…' : user ? 'Begin a scene' : 'Sign in to begin a scene'}
            </button>
            {isOwner && <Link to={`/create/${character.id}`} className="inline-flex min-h-[52px] items-center rounded-full border border-chimera-gold/50 px-6 text-base font-bold hover:bg-chimera-gold/10">Edit character</Link>}
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
            <p className="text-lg leading-relaxed text-violet-100/85">Replies are written by an AI. Each scene keeps a memory you can read, edit or clear at any time.</p>
          </div>
        </section>
      )}
    </div>
  );
}
