import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VISIBILITY_LABEL, type Visibility } from '../lib/characters';

interface Row {
  id: string;
  name: string | null;
  short_description: string | null;
  visibility: Visibility;
  status: string | null;
}

export default function MyCharactersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from('ai_characters')
      .select('id, name:chat_name, short_description, visibility, status')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setFailed(true);
        else setRows((data ?? []) as Row[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">YOUR CHARACTERS</p>
          <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Your cast.</h1>
        </div>
        <Link to="/create" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">
          <Plus size={18} aria-hidden="true" /> New character
        </Link>
      </div>

      <section className="mt-8" aria-live="polite">
        {loading ? (
          <p className="py-12 text-center text-chimera-mute">Loading your characters…</p>
        ) : failed ? (
          <p className="py-12 text-center text-chimera-mute">We could not load your characters right now. Please try again in a moment.</p>
        ) : rows.length === 0 ? (
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-8 text-center">
            <p className="text-lg text-violet-100/85">You have not created a character yet.</p>
            <Link to="/create" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">Create your first character</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-700 to-chimera-rose font-serif text-xl text-white" aria-hidden="true">{(row.name ?? '?').slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-xl font-semibold">{row.name || 'Unnamed character'}</span>
                  <span className="block truncate text-sm text-chimera-mute">{row.short_description || 'No tagline yet'}</span>
                </span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold tracking-[0.1em] text-violet-100/80">{VISIBILITY_LABEL[row.visibility] ?? row.visibility}</span>
                <span className="flex gap-2">
                  <Link to={`/characters/${row.id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Open</Link>
                  <Link to={`/create/${row.id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Edit</Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
