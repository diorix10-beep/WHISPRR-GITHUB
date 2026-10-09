import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LorebookJsonImport } from '../components/lorebooks/LorebookJsonImport';
import { createLorebookWithEntries, formsFromImport, loadMyLorebooks, themeOf, type LorebookSummary } from '../lib/lorebooks';

const FIELD = 'w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';

type SortKey = 'latest' | 'name' | 'entries';

export default function LorebooksPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [books, setBooks] = useState<LorebookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');

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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? books.filter((book) => `${book.title} ${book.description}`.toLowerCase().includes(q)) : [...books];
    if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'entries') list.sort((a, b) => b.entry_count - a.entry_count || a.title.localeCompare(b.title));
    return list;
  }, [books, query, sort]);

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
        A lorebook holds what your characters should know about their world: places, people, rules, history. An entry is only sent to the AI when one of its keywords comes up in the last few messages, so a big world never weighs down every reply.
      </p>

      <div className="mt-6 flex flex-wrap items-start gap-3">
        <Link to="/lorebooks/new" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">
          <Plus size={18} aria-hidden="true" /> New lorebook
        </Link>
        {user && (
          <LorebookJsonImport
            showName
            label="Import JSON"
            confirmLabel={(read) => `Create a lorebook with ${read.entries.length.toLocaleString()} ${read.entries.length === 1 ? 'entry' : 'entries'}`}
            onConfirm={async (read) => {
              const id = await createLorebookWithEntries(
                user.id,
                { title: read.name || 'Imported lorebook', description: read.description, scanDepth: read.scanDepth ?? undefined },
                formsFromImport(read.entries),
              );
              navigate(`/lorebooks/${id}`);
            }}
          />
        )}
      </div>

      {books.length > 0 && (
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1">
            <label htmlFor="lb-search" className="sr-only">Search your lorebooks</label>
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-chimera-mute" />
            <input id="lb-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className={`${FIELD} pl-10`} />
          </div>
          <div>
            <label htmlFor="lb-sort" className="sr-only">Sort</label>
            <select id="lb-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={FIELD}>
              <option value="latest">Latest</option>
              <option value="name">Name</option>
              <option value="entries">Most entries</option>
            </select>
          </div>
        </div>
      )}

      <section className="mt-6" aria-live="polite">
        {loading ? (
          <p className="py-12 text-center text-chimera-mute">Loading your lorebooks…</p>
        ) : failed ? (
          <p className="py-12 text-center text-chimera-mute">We could not load your lorebooks right now. Please try again in a moment.</p>
        ) : books.length === 0 ? (
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-8 text-center">
            <BookOpen className="mx-auto text-chimera-gold" size={30} aria-hidden="true" />
            <p className="mt-3 text-lg text-violet-100/85">You have no lorebook yet. Create one, or import one from a JSON file.</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-12 text-center text-chimera-mute">No lorebook matches your search.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((book) => {
              const theme = themeOf(book.theme);
              return (
                <li key={book.id} className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
                  <div className="flex items-start gap-4">
                    <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                      <BookOpen size={26} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-2xl font-semibold">{book.title}</span>
                      {book.description && <span className="block truncate text-sm text-chimera-mute">{book.description}</span>}
                      <span className="mt-1 block text-sm text-chimera-mute">
                        {book.entry_count} {book.entry_count === 1 ? 'entry' : 'entries'} · {book.characters} {book.characters === 1 ? 'character' : 'characters'} · checks the last {book.scan_depth} {book.scan_depth === 1 ? 'message' : 'messages'}
                        {book.visibility !== 'private' && ` · ${book.visibility}`}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to={`/lorebooks/${book.id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Open</Link>
                    <button type="button" onClick={() => void remove(book)} className="min-h-[40px] rounded-full px-4 text-sm text-chimera-mute hover:text-chimera-rose" aria-label={`Delete ${book.title}`}>Delete</button>
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
