import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createLorebook, loadMyLorebooks, LOREBOOK_LIMITS, type LorebookSummary } from '../lib/lorebooks';

const FIELD = 'w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';

export default function LorebooksPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [books, setBooks] = useState<LorebookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = async (userId: string) => {
    try {
      setBooks(await loadMyLorebooks(userId));
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) void refresh(user.id);
  }, [user]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || creating) return;
    setCreating(true);
    try {
      const id = await createLorebook(user.id, title);
      navigate(`/lorebooks/${id}`);
    } catch {
      showToast('We could not create the lorebook. Please try again.', 'error');
      setCreating(false);
    }
  };

  const remove = async (book: LorebookSummary) => {
    if (!window.confirm(`Delete "${book.title}" and its ${book.entry_count} ${book.entry_count === 1 ? 'entry' : 'entries'}? Your characters will no longer use it.`)) return;
    const { error } = await supabase.from('lorebooks').delete().eq('id', book.id).eq('user_id', user!.id);
    if (error) {
      showToast('We could not delete that lorebook.', 'error');
      return;
    }
    await refresh(user!.id);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-8 sm:px-8">
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">YOUR LOREBOOKS</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">The world, remembered.</h1>
      <p className="mt-3 max-w-xl text-chimera-mute">
        A lorebook holds what your characters should know about their world: places, people, rules, history. An entry is only sent to the AI when one of its keywords comes up in the scene, so a big world never weighs down every reply.
      </p>

      <form onSubmit={(e) => void create(e)} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="lb-new" className="font-bold">New lorebook</label>
          <input id="lb-new" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LOREBOOK_LIMITS.title} className={`${FIELD} mt-2`} placeholder="The Sunken Archipelago" />
        </div>
        <button type="submit" disabled={creating} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
          <Plus size={18} aria-hidden="true" /> {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      <section className="mt-8" aria-live="polite">
        {loading ? (
          <p className="py-12 text-center text-chimera-mute">Loading your lorebooks…</p>
        ) : failed ? (
          <p className="py-12 text-center text-chimera-mute">We could not load your lorebooks right now. Please try again in a moment.</p>
        ) : books.length === 0 ? (
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-8 text-center">
            <BookOpen className="mx-auto text-chimera-gold" size={30} aria-hidden="true" />
            <p className="mt-3 text-lg text-violet-100/85">You have no lorebook yet. Name one above to start.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {books.map((book) => (
              <li key={book.id} className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-2xl font-semibold">{book.title}</span>
                    <span className="block text-sm text-chimera-mute">
                      {book.entry_count} {book.entry_count === 1 ? 'entry' : 'entries'}
                      {book.visibility !== 'private' && ` · ${book.visibility}`}
                    </span>
                    {book.description && <span className="block truncate text-sm text-chimera-mute">{book.description}</span>}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/lorebooks/${book.id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Open</Link>
                  <button type="button" onClick={() => void remove(book)} className="min-h-[40px] rounded-full px-4 text-sm text-chimera-mute hover:text-chimera-rose" aria-label={`Delete ${book.title}`}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
