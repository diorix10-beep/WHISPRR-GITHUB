import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VISIBILITY_LABEL, type Visibility } from '../lib/characters';
import { STATUS_LABEL, type StoryStatus } from '../lib/stories';

interface Row {
  id: string;
  title: string;
  summary: string | null;
  visibility: Visibility;
  status: StoryStatus | null;
  chapters: Array<{ id: string; status: string }>;
}

export default function WorkspacePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from('stories')
      .select('id, title, summary, visibility, status, chapters:story_chapters(id, status)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setFailed(true);
        else setRows((data ?? []) as unknown as Row[]);
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
          <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">WRITER&apos;S DESK</p>
          <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Your stories.</h1>
        </div>
        <Link to="/stories/new" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">
          <Plus size={18} aria-hidden="true" /> New story
        </Link>
      </div>

      <section className="mt-8" aria-live="polite">
        {loading ? (
          <p className="py-12 text-center text-chimera-mute">Opening your desk…</p>
        ) : failed ? (
          <p className="py-12 text-center text-chimera-mute">We could not load your stories right now. Please try again in a moment.</p>
        ) : rows.length === 0 ? (
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-8 text-center">
            <p className="text-lg text-violet-100/85">Your desk is empty. Start with a title; the rest can wait.</p>
            <Link to="/stories/new" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">Write your first story</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const published = row.chapters.filter((c) => c.status === 'published').length;
              return (
                <li key={row.id} className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-serif text-2xl font-semibold">{row.title}</h2>
                      <p className="mt-1 text-sm text-chimera-mute">
                        {row.chapters.length} {row.chapters.length === 1 ? 'chapter' : 'chapters'}, {published} published
                        {row.status ? ` · ${STATUS_LABEL[row.status] ?? row.status}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold tracking-[0.1em] text-violet-100/80">{VISIBILITY_LABEL[row.visibility] ?? row.visibility}</span>
                  </div>
                  {row.summary && <p className="mt-2 line-clamp-2 text-violet-100/80">{row.summary}</p>}
                  <div className="mt-3 flex gap-2">
                    <Link to={`/stories/${row.id}/edit`} className="inline-flex min-h-[40px] items-center rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] hover:brightness-110">Write</Link>
                    <Link to={`/stories/${row.id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Read</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
