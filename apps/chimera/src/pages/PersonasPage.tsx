import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { loadMyPersonas, type PersonaSummary } from '../lib/personas';

export default function PersonasPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refresh = async (userId: string) => {
    try {
      setPersonas(await loadMyPersonas(userId));
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) void refresh(user.id);
  }, [user]);

  const makeDefault = async (persona: PersonaSummary) => {
    const { error } = await supabase.from('personas').update({ is_default: true }).eq('id', persona.id).eq('user_id', user!.id);
    if (error) {
      showToast('We could not change your default persona.', 'error');
      return;
    }
    await refresh(user!.id);
  };

  const remove = async (persona: PersonaSummary) => {
    if (!window.confirm(`Delete "${persona.name}"? Scenes that used it will go back to playing as yourself.`)) return;
    const { error } = await supabase.from('personas').delete().eq('id', persona.id).eq('user_id', user!.id);
    if (error) {
      showToast('We could not delete that persona.', 'error');
      return;
    }
    await refresh(user!.id);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">YOUR PERSONAS</p>
          <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Who you are in the story.</h1>
          <p className="mt-3 max-w-xl text-chimera-mute">A persona tells characters who they are talking to: your name, pronouns and background. Pick one when you begin a scene.</p>
        </div>
        <Link to="/personas/new" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">
          <Plus size={18} aria-hidden="true" /> New persona
        </Link>
      </div>

      <section className="mt-8" aria-live="polite">
        {loading ? (
          <p className="py-12 text-center text-chimera-mute">Loading your personas…</p>
        ) : failed ? (
          <p className="py-12 text-center text-chimera-mute">We could not load your personas right now. Please try again in a moment.</p>
        ) : personas.length === 0 ? (
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-8 text-center">
            <p className="text-lg text-violet-100/85">You have no persona yet. Without one, characters treat you as yourself.</p>
            <Link to="/personas/new" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">Create your first persona</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {personas.map((persona) => (
              <li key={persona.id} className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-700 to-chimera-blue font-serif text-xl text-white" aria-hidden="true">{persona.name.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-serif text-2xl font-semibold">{persona.name}</span>
                      {persona.is_default && <span className="inline-flex items-center gap-1 rounded-full border border-chimera-gold/50 px-2 py-0.5 text-xs font-bold tracking-[0.1em] text-chimera-gold"><Star size={12} aria-hidden="true" /> DEFAULT</span>}
                    </span>
                    {persona.description && <span className="block truncate text-sm text-chimera-mute">{persona.description}</span>}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/personas/${persona.id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Edit</Link>
                  {!persona.is_default && <button type="button" onClick={() => void makeDefault(persona)} className="min-h-[40px] rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Make default</button>}
                  <button type="button" onClick={() => void remove(persona)} className="min-h-[40px] rounded-full px-4 text-sm text-chimera-mute hover:text-chimera-rose" aria-label={`Delete ${persona.name}`}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
