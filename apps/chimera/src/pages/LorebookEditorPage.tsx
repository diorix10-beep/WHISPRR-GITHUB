import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  EMPTY_ENTRY,
  ENTRY_SENT_CHARACTERS,
  LOREBOOK_LIMITS,
  LOREBOOK_SENT_CHARACTERS,
  entryFromRow,
  entryRow,
  parseKeywords,
  validateEntry,
  type EntryForm,
} from '../lib/lorebooks';

const FIELD = 'mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';

interface EntryState {
  key: string;
  form: EntryForm;
  /** The form as last saved, to tell whether there is something to save. */
  saved: string;
  busy: boolean;
  problem: string | null;
  /** A new entry opens as it is added and stays as it is when saved, so it never folds up under the writer. */
  startOpen: boolean;
}

interface CharacterOption {
  id: string;
  chat_name: string | null;
}

let counter = 0;
const nextKey = () => `e${(counter += 1)}`;

export default function LorebookEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [savedHead, setSavedHead] = useState('');
  const [savingHead, setSavingHead] = useState(false);
  const [entries, setEntries] = useState<EntryState[]>([]);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [linkBusy, setLinkBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    let active = true;
    (async () => {
      const { data: book } = await supabase
        .from('lorebooks')
        .select('id, title, description')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (!book) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const [entryResult, characterResult, linkResult] = await Promise.all([
        supabase.from('lorebook_entries').select('*').eq('lorebook_id', id).order('insertion_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('ai_characters').select('id, chat_name').eq('creator_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('lorebook_characters').select('character_id').eq('lorebook_id', id),
      ]);
      if (!active) return;
      const head = book as { title: string; description: string | null };
      setTitle(head.title);
      setDescription(head.description ?? '');
      setSavedHead(JSON.stringify([head.title, head.description ?? '']));
      setEntries(((entryResult.data ?? []) as Array<Record<string, unknown>>).map((row) => {
        const form = entryFromRow(row);
        return { key: nextKey(), form, saved: JSON.stringify(form), busy: false, problem: null, startOpen: false };
      }));
      setCharacters((characterResult.data ?? []) as CharacterOption[]);
      setLinked(new Set(((linkResult.data ?? []) as Array<{ character_id: string }>).map((row) => row.character_id)));
      setLoading(false);
    })().catch(() => {
      if (active) {
        setNotFound(true);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user, id]);

  const headDirty = useMemo(() => JSON.stringify([title, description]) !== savedHead, [title, description, savedHead]);

  const saveHead = async () => {
    if (!user || !id || savingHead) return;
    setSavingHead(true);
    const { error } = await supabase
      .from('lorebooks')
      .update({ title: title.trim().slice(0, LOREBOOK_LIMITS.title) || 'Untitled lorebook', description: description.trim().slice(0, LOREBOOK_LIMITS.description) })
      .eq('id', id)
      .eq('user_id', user.id);
    setSavingHead(false);
    if (error) {
      showToast('We could not save the lorebook.', 'error');
      return;
    }
    setSavedHead(JSON.stringify([title, description]));
    showToast('Lorebook saved.', 'success');
  };

  const patchEntry = (key: string, change: Partial<EntryState> | ((state: EntryState) => Partial<EntryState>)) =>
    setEntries((all) => all.map((entry) => (entry.key === key ? { ...entry, ...(typeof change === 'function' ? change(entry) : change) } : entry)));

  const edit = (key: string, change: Partial<EntryForm>) => patchEntry(key, (state) => ({ form: { ...state.form, ...change }, problem: null }));

  const addEntry = () => {
    setEntries((all) => [...all, { key: nextKey(), form: { ...EMPTY_ENTRY }, saved: '', busy: false, problem: null, startOpen: true }]);
  };

  const saveEntry = async (state: EntryState) => {
    if (!id) return;
    const problem = validateEntry(state.form);
    if (problem) {
      patchEntry(state.key, { problem });
      return;
    }
    patchEntry(state.key, { busy: true, problem: null });
    // Entries keep the order they appear in on the page.
    const order = Math.max(0, entries.findIndex((entry) => entry.key === state.key));
    const row = entryRow(state.form, id, order);
    const query = state.form.id
      ? supabase.from('lorebook_entries').update(row).eq('id', state.form.id).eq('lorebook_id', id).select('id').single()
      : supabase.from('lorebook_entries').insert(row).select('id').single();
    const { data, error } = await query;
    if (error || !data) {
      patchEntry(state.key, { busy: false, problem: 'We could not save this entry. Your text is still here, please try again.' });
      return;
    }
    const newId = (data as { id: string }).id;
    const tidy = parseKeywords(state.form.keywords).join(', ');
    // What was saved is what was sent. Anything typed while the save was in flight stays in the form, and shows as unsaved.
    const sent: EntryForm = { ...state.form, id: newId, keywords: tidy };
    patchEntry(state.key, (current) => ({
      form: { ...current.form, id: newId, keywords: current.form.keywords === state.form.keywords ? tidy : current.form.keywords },
      saved: JSON.stringify(sent),
      busy: false,
      problem: null,
    }));
  };

  const removeEntry = async (state: EntryState) => {
    if (state.form.id) {
      if (!window.confirm('Delete this entry?')) return;
      patchEntry(state.key, { busy: true });
      const { error } = await supabase.from('lorebook_entries').delete().eq('id', state.form.id).eq('lorebook_id', id!);
      if (error) {
        patchEntry(state.key, { busy: false, problem: 'We could not delete this entry.' });
        return;
      }
    }
    setEntries((all) => all.filter((entry) => entry.key !== state.key));
  };

  const toggleCharacter = async (characterId: string, on: boolean) => {
    if (!id || linkBusy) return;
    setLinkBusy(characterId);
    const { error } = on
      ? await supabase.from('lorebook_characters').insert({ lorebook_id: id, character_id: characterId })
      : await supabase.from('lorebook_characters').delete().eq('lorebook_id', id).eq('character_id', characterId);
    setLinkBusy(null);
    if (error) {
      showToast('We could not change which characters use this lorebook.', 'error');
      return;
    }
    setLinked((all) => {
      const next = new Set(all);
      if (on) next.add(characterId);
      else next.delete(characterId);
      return next;
    });
  };

  if (loading) return <p className="py-24 text-center text-chimera-mute">Opening the lorebook…</p>;
  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Lorebook not found</h1>
        <p className="mt-3 text-chimera-mute">Only its creator can open a lorebook.</p>
        <Link to="/lorebooks" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Your lorebooks</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/lorebooks" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Your lorebooks
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">LOREBOOK</p>

      <section className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-5">
        <label htmlFor="lb-title" className="font-bold">Name</label>
        <input id="lb-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LOREBOOK_LIMITS.title} className={FIELD} />
        <label htmlFor="lb-description" className="mt-4 block font-bold">What it is <span className="font-normal text-chimera-mute">(optional, only for you)</span></label>
        <textarea id="lb-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={LOREBOOK_LIMITS.description} className={FIELD} />
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => void saveHead()} disabled={!headDirty || savingHead} className="inline-flex min-h-[44px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {savingHead ? 'Saving…' : 'Save name'}
          </button>
          {headDirty && <span className="text-sm text-chimera-mute">Unsaved changes</span>}
        </div>
      </section>

      <section aria-labelledby="lb-how" className="mt-6 rounded-2xl border border-chimera-gold/20 bg-chimera-panel2 p-5">
        <h2 id="lb-how" className="font-serif text-xl font-semibold text-chimera-gold">How it works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-violet-100/85">
          <li>An entry is sent to the AI only when one of its keywords appears in the latest messages, or when &quot;Always send&quot; is on.</li>
          <li>At most about {LOREBOOK_SENT_CHARACTERS.toLocaleString()} characters of lorebook go with one reply, and an entry is cut at {ENTRY_SENT_CHARACTERS.toLocaleString()}. Several short entries work better than one long one. When there is not room for everything, higher priority goes first.</li>
          <li>Only the characters you tick below use this lorebook. It is private to you, but like the rest of a character&apos;s definition, someone chatting with your character may manage to get it to reveal what it says.</li>
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="lb-entries">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lb-entries" className="font-serif text-2xl font-semibold">Entries <span className="text-base font-normal text-chimera-mute">({entries.length})</span></h2>
          <button type="button" onClick={addEntry} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">
            <Plus size={18} aria-hidden="true" /> Add entry
          </button>
        </div>

        {entries.length === 0 && <p className="mt-4 text-chimera-mute">No entry yet. Add one: a place, a person, a rule of this world.</p>}

        <ul className="mt-4 flex flex-col gap-4">
          {entries.map((state, index) => {
            const dirty = JSON.stringify(state.form) !== state.saved;
            const longText = state.form.content.trim().length > ENTRY_SENT_CHARACTERS;
            const fieldId = (name: string) => `${state.key}-${name}`;
            return (
              <li key={state.key}>
                <details open={state.startOpen} className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                    <span className="font-serif text-xl font-semibold">{state.form.title.trim() || parseKeywords(state.form.keywords)[0] || `Entry ${index + 1}`}</span>
                    {state.form.isConstant && <span className="rounded-full border border-chimera-gold/50 px-2 py-0.5 text-xs font-bold tracking-[0.1em] text-chimera-gold">ALWAYS</span>}
                    {!state.form.enabled && <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs font-bold tracking-[0.1em] text-chimera-mute">OFF</span>}
                    {dirty && <span className="text-sm text-chimera-mute">Unsaved</span>}
                  </summary>

                  <div className="mt-3">
                    <label htmlFor={fieldId('title')} className="font-bold">Name <span className="font-normal text-chimera-mute">(optional)</span></label>
                    <input id={fieldId('title')} value={state.form.title} onChange={(e) => edit(state.key, { title: e.target.value })} maxLength={LOREBOOK_LIMITS.entryTitle} className={FIELD} placeholder="The Lantern Guild" />
                  </div>
                  <div className="mt-4">
                    <label htmlFor={fieldId('keywords')} className="font-bold">Keywords</label>
                    <p className="text-sm text-chimera-mute">Words or names that bring this into the story. Separate them with commas.</p>
                    <input id={fieldId('keywords')} value={state.form.keywords} onChange={(e) => edit(state.key, { keywords: e.target.value })} className={FIELD} placeholder="lantern guild, guildmaster, the Lanterns" />
                  </div>
                  <div className="mt-4">
                    <label htmlFor={fieldId('content')} className="font-bold">What the AI should know</label>
                    <textarea id={fieldId('content')} value={state.form.content} onChange={(e) => edit(state.key, { content: e.target.value })} rows={6} className={FIELD} />
                    {longText && <p className="mt-1 text-sm text-amber-200">Only the first {ENTRY_SENT_CHARACTERS.toLocaleString()} characters are sent with a reply. Consider splitting this into several entries.</p>}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={state.form.isConstant} onChange={(e) => edit(state.key, { isConstant: e.target.checked })} className="mt-1 h-5 w-5 accent-[#e8c27a]" />
                      <span><span className="font-bold">Always send</span><span className="block text-sm text-chimera-mute">Even when no keyword is mentioned.</span></span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={state.form.enabled} onChange={(e) => edit(state.key, { enabled: e.target.checked })} className="mt-1 h-5 w-5 accent-[#e8c27a]" />
                      <span><span className="font-bold">On</span><span className="block text-sm text-chimera-mute">Turn off to keep it without using it.</span></span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={state.form.caseSensitive} onChange={(e) => edit(state.key, { caseSensitive: e.target.checked })} className="mt-1 h-5 w-5 accent-[#e8c27a]" />
                      <span><span className="font-bold">Match capitals exactly</span><span className="block text-sm text-chimera-mute">&quot;Rose&quot; will not match &quot;rose&quot;.</span></span>
                    </label>
                    <div>
                      <label htmlFor={fieldId('priority')} className="font-bold">Priority</label>
                      <input id={fieldId('priority')} type="number" step={1} value={state.form.priority} onChange={(e) => edit(state.key, { priority: Number(e.target.value) })} className={`${FIELD} mt-1`} />
                      <span className="text-sm text-chimera-mute">Higher goes first when space is short.</span>
                    </div>
                  </div>

                  {state.problem && <p role="alert" className="mt-4 rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-[15px] text-rose-100">{state.problem}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => void saveEntry(state)} disabled={state.busy || (!dirty && !!state.form.id)} className="inline-flex min-h-[44px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                      {state.busy ? 'Saving…' : 'Save entry'}
                    </button>
                    <button type="button" onClick={() => void removeEntry(state)} disabled={state.busy} className="min-h-[44px] rounded-full px-4 text-chimera-mute hover:text-chimera-rose disabled:opacity-50">Delete</button>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="lb-chars">
        <h2 id="lb-chars" className="font-serif text-2xl font-semibold">Characters that use it</h2>
        <p className="mt-1 text-chimera-mute">Tick the characters who should know this world.</p>
        {characters.length === 0 ? (
          <p className="mt-4 text-chimera-mute">
            You have no character yet. <Link to="/create" className="font-bold text-chimera-gold underline">Create one</Link>, then come back.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {characters.map((character) => (
              <li key={character.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-chimera-gold/20 bg-chimera-panel px-4 py-3">
                  <input
                    type="checkbox"
                    checked={linked.has(character.id)}
                    disabled={linkBusy === character.id}
                    onChange={(e) => void toggleCharacter(character.id, e.target.checked)}
                    className="h-5 w-5 accent-[#e8c27a]"
                  />
                  <span className="font-bold">{character.chat_name || 'Unnamed character'}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        <button type="button" onClick={() => navigate('/lorebooks')} className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-6 font-bold hover:bg-chimera-gold/10">Done</button>
      </div>
    </div>
  );
}
