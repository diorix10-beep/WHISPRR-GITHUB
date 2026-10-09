import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Lock, Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CharacterAvatar } from '../components/characters/CharacterAvatar';
import { BudgetSlider } from '../components/lorebooks/BudgetSlider';
import { DepthStepper } from '../components/lorebooks/DepthStepper';
import { LorebookJsonImport } from '../components/lorebooks/LorebookJsonImport';
import { ThemePicker } from '../components/lorebooks/ThemePicker';
import { lorebookToJson } from '../lib/lorebookJson';
import {
  DEFAULT_REPLY_BUDGET,
  DEFAULT_SCAN_DEPTH,
  EMPTY_ENTRY,
  ENTRY_SENT_CHARACTERS,
  LOREBOOK_LIMITS,
  MAX_REPLY_BUDGET,
  MAX_SCAN_DEPTH,
  entryFromRow,
  entryRow,
  formsFromImport,
  insertEntries,
  loadEntryRows,
  lorebookRow,
  parseKeywords,
  themeOf,
  validDepth,
  validateEntry,
  type EntryForm,
  type ThemeId,
} from '../lib/lorebooks';

const FIELD = 'mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';
const PAGE = 30;

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
  avatar_url: string | null;
}

type SortKey = 'priority' | 'name' | 'written';

let counter = 0;
const nextKey = () => `e${(counter += 1)}`;

const displayName = (form: EntryForm, index: number) => form.title.trim() || parseKeywords(form.keywords)[0] || `Entry ${index + 1}`;

function toState(row: Record<string, unknown>): EntryState {
  const form = entryFromRow(row);
  return { key: nextKey(), form, saved: JSON.stringify(form), busy: false, problem: null, startOpen: false };
}

export default function LorebookEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<ThemeId>('purple');
  const [scanDepth, setScanDepth] = useState(DEFAULT_SCAN_DEPTH);
  const [replyBudget, setReplyBudget] = useState(DEFAULT_REPLY_BUDGET);
  const [savedHead, setSavedHead] = useState('');
  const [savingHead, setSavingHead] = useState(false);
  const [entries, setEntries] = useState<EntryState[]>([]);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [linkBusy, setLinkBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('priority');
  const [shown, setShown] = useState(PAGE);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // After an import: adds the new rows and leaves every entry already on the page exactly as it is, unsaved edits included.
  const addImportedEntries = useCallback(async () => {
    if (!id) return;
    const rows = await loadEntryRows(id);
    setEntries((current) => {
      const known = new Set(current.map((entry) => entry.form.id).filter(Boolean));
      return [...current, ...rows.filter((row) => !known.has(row.id as string)).map(toState)];
    });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    let active = true;
    (async () => {
      // All columns, so a lorebook that has no colour or depth yet still opens.
      const { data: book } = await supabase.from('lorebooks').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
      if (!active) return;
      if (!book) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const [entryResult, characterResult, linkResult] = await Promise.all([
        supabase.from('lorebook_entries').select('*').eq('lorebook_id', id).order('insertion_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('ai_characters').select('id, chat_name, avatar_url').eq('creator_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('lorebook_characters').select('character_id').eq('lorebook_id', id),
      ]);
      if (!active) return;
      const head = book as Record<string, unknown>;
      const row = lorebookRow({ title: String(head.title ?? ''), description: String(head.description ?? ''), theme: head.theme as ThemeId, scanDepth: Number(head.scan_depth), replyBudget: Number(head.reply_budget) });
      setTitle(row.title);
      setDescription(row.description);
      setTheme(row.theme);
      setScanDepth(row.scan_depth);
      setReplyBudget(row.reply_budget);
      setSavedHead(JSON.stringify([row.title, row.description, row.theme, row.scan_depth, row.reply_budget]));
      setEntries(((entryResult.data ?? []) as Array<Record<string, unknown>>).map(toState));
      setCharacters((characterResult.data ?? []) as CharacterOption[]);
      setLinked(new Set(((linkResult.data ?? []) as Array<{ character_id: string }>).map((link) => link.character_id)));
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

  const headDirty = useMemo(() => JSON.stringify([title, description, theme, scanDepth, replyBudget]) !== savedHead, [title, description, theme, scanDepth, replyBudget, savedHead]);

  const saveHead = async () => {
    if (!user || !id || savingHead) return;
    setSavingHead(true);
    const row = lorebookRow({ title, description, theme, scanDepth, replyBudget });
    const { error } = await supabase.from('lorebooks').update(row).eq('id', id).eq('user_id', user.id);
    setSavingHead(false);
    if (error) {
      showToast('We could not save the lorebook.', 'error');
      return;
    }
    setSavedHead(JSON.stringify([title, description, theme, scanDepth, replyBudget]));
    showToast('Lorebook saved.', 'success');
  };

  const patchEntry = (key: string, change: Partial<EntryState> | ((state: EntryState) => Partial<EntryState>)) =>
    setEntries((all) => all.map((entry) => (entry.key === key ? { ...entry, ...(typeof change === 'function' ? change(entry) : change) } : entry)));

  const edit = (key: string, change: Partial<EntryForm>) => patchEntry(key, (state) => ({ form: { ...state.form, ...change }, problem: null }));

  const addEntry = () => {
    setSearch('');
    const key = nextKey();
    setEntries((all) => [...all, { key, form: { ...EMPTY_ENTRY }, saved: '', busy: false, problem: null, startOpen: true }]);
    setJustAdded(key);
  };

  // The new entry may sit far down the list: bring it into view and put the cursor in its name.
  useEffect(() => {
    if (!justAdded) return;
    const field = document.getElementById(`${justAdded}-title`);
    if (field) {
      field.scrollIntoView?.({ block: 'center' });
      field.focus({ preventScroll: true });
      setJustAdded(null);
    }
  }, [justAdded, entries]);

  const saveEntry = async (state: EntryState) => {
    if (!id) return;
    const problem = validateEntry(state.form);
    if (problem) {
      patchEntry(state.key, { problem });
      return;
    }
    patchEntry(state.key, { busy: true, problem: null });
    // Entries keep the order they were written in.
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

  const exportJson = () => {
    const ready = entries.filter((entry) => entry.form.content.trim());
    const data = lorebookToJson(
      { name: title.trim() || 'Lorebook', description: description.trim(), scanDepth, replyBudget },
      ready.map((entry, index) => ({
        title: displayName(entry.form, index),
        keywords: parseKeywords(entry.form.keywords),
        content: entry.form.content.trim(),
        isConstant: entry.form.isConstant,
        caseSensitive: entry.form.caseSensitive,
        enabled: entry.form.enabled,
        priority: Math.trunc(entry.form.priority) || 0,
        scanDepth: validDepth(entry.form.scanDepth),
      })),
    );
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title.trim() || 'lorebook').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'lorebook'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Which entries are listed: the search, then the order. A new entry that is not written yet is always listed.
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = entries.map((state, index) => ({ state, index }));
    if (q) items = items.filter(({ state }) => !state.form.id || `${state.form.title} ${state.form.keywords} ${state.form.content}`.toLowerCase().includes(q));
    if (sort === 'priority') items.sort((a, b) => b.state.form.priority - a.state.form.priority || a.index - b.index);
    else if (sort === 'name') items.sort((a, b) => displayName(a.state.form, a.index).localeCompare(displayName(b.state.form, b.index)));
    return items;
  }, [entries, search, sort]);
  // Entries written on this page (startOpen) stay listed whatever the page limit is, so adding one never seems to do nothing.
  const visible = list.filter(({ state }, position) => position < shown || state.startOpen);

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

  const accent = themeOf(theme);
  // What the entries marked "Always send" use of every reply, each cut at the size it would really be sent.
  const alwaysSent = entries.reduce((total, { form }) => (form.isConstant && form.enabled ? total + Math.min(form.content.trim().length, ENTRY_SENT_CHARACTERS, replyBudget) : total), 0);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/lorebooks" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Your lorebooks
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">LOREBOOK</p>

      <section className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-5" style={{ borderTopColor: accent.to, borderTopWidth: 4 }}>
        <label htmlFor="lb-title" className="font-bold">Name</label>
        <input id="lb-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LOREBOOK_LIMITS.title} className={FIELD} />
        <div className="mt-4">
          <ThemePicker name="lb-theme" value={theme} onChange={setTheme} />
        </div>
        <label htmlFor="lb-description" className="mt-4 block font-bold">Description <span className="font-normal text-chimera-mute">(optional, only for you)</span></label>
        <textarea id="lb-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={LOREBOOK_LIMITS.description} className={FIELD} />
        <div className="mt-4">
          <p id="lb-depth" className="font-bold">Message depth</p>
          <p className="text-sm text-chimera-mute">How many of the latest chat messages this lorebook checks for keywords, newest first (1 to {MAX_SCAN_DEPTH}). An entry can ask for its own number.</p>
          <DepthStepper id="lb-depth" value={scanDepth} onChange={setScanDepth} />
        </div>
        <div className="mt-4">
          <p id="lb-budget" className="font-bold">Size per reply <span className="font-normal text-chimera-mute">(characters)</span></p>
          <p className="text-sm text-chimera-mute">The most text from this lorebook sent with one reply (up to {MAX_REPLY_BUDGET.toLocaleString()}). More lets bigger entries through, but every reply then costs more and leaves less room for the chat. About 4 characters make 1 token.</p>
          <BudgetSlider id="lb-budget" value={replyBudget} onChange={setReplyBudget} />
          {alwaysSent > 0 && (
            <p className={`mt-1 text-sm ${alwaysSent > replyBudget ? 'text-amber-200' : 'text-chimera-mute'}`}>
              Entries marked &quot;Always send&quot; already take about {alwaysSent.toLocaleString()} characters{alwaysSent > replyBudget ? ': more than this size, so some of them will be left out' : ''}.
            </p>
          )}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button type="button" onClick={() => void saveHead()} disabled={!headDirty || savingHead} className="inline-flex min-h-[44px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {savingHead ? 'Saving…' : 'Save lorebook'}
          </button>
          {headDirty && <span className="text-sm text-chimera-mute">Unsaved changes</span>}
        </div>
      </section>

      <section aria-labelledby="lb-how" className="mt-6 rounded-2xl border border-chimera-gold/20 bg-chimera-panel2 p-5">
        <h2 id="lb-how" className="font-serif text-xl font-semibold text-chimera-gold">How it works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-violet-100/85">
          <li>An entry is sent to the AI only when one of its keywords appears in the latest {scanDepth} {scanDepth === 1 ? 'message' : 'messages'}, or when &quot;Always send&quot; is on.</li>
          <li>At most {replyBudget.toLocaleString()} characters of lorebook go with one reply (you can change this above), and an entry is cut at {ENTRY_SENT_CHARACTERS.toLocaleString()}. Several short entries work better than one long one. When there is not room for everything, higher priority goes first.</li>
          <li>Only the characters you tick below use this lorebook. It is private to you, but like the rest of a character&apos;s definition, someone chatting with your character may manage to get it to reveal what it says.</li>
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="lb-entries">
        <h2 id="lb-entries" className="font-serif text-2xl font-semibold">Entries <span className="text-base font-normal text-chimera-mute">({entries.length})</span></h2>

        <div className="mt-3 flex flex-wrap items-start gap-3">
          <button type="button" onClick={addEntry} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">
            <Plus size={18} aria-hidden="true" /> Add entry
          </button>
          <LorebookJsonImport
            label="Import JSON"
            confirmLabel={(read) => `Add ${read.entries.length.toLocaleString()} ${read.entries.length === 1 ? 'entry' : 'entries'} to this lorebook`}
            onConfirm={async (read) => {
              await insertEntries(id!, formsFromImport(read.entries), entries.length);
              await addImportedEntries();
              showToast(`${read.entries.length.toLocaleString()} ${read.entries.length === 1 ? 'entry' : 'entries'} added.`, 'success');
            }}
          />
          <button type="button" onClick={exportJson} disabled={!entries.some((entry) => entry.form.content.trim())} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10 disabled:cursor-not-allowed disabled:opacity-50">
            <FileDown size={18} aria-hidden="true" /> Export JSON
          </button>
        </div>

        {entries.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="relative min-w-[200px] flex-1">
              <label htmlFor="lb-entry-search" className="sr-only">Search the entries</label>
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-chimera-mute" />
              <input id="lb-entry-search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setShown(PAGE); }} placeholder="Search the entries" className={`${FIELD} mt-0 pl-10`} />
            </div>
            <div>
              <label htmlFor="lb-entry-sort" className="sr-only">Sort the entries</label>
              <select id="lb-entry-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FIELD} mt-0`}>
                <option value="priority">Sort by: Priority</option>
                <option value="name">Sort by: Name</option>
                <option value="written">Sort by: As written</option>
              </select>
            </div>
          </div>
        )}

        {entries.length === 0 && <p className="mt-4 text-chimera-mute">No entry yet. Add one: a place, a person, a rule of this world. Or import a JSON file.</p>}
        {entries.length > 0 && list.length === 0 && <p className="mt-4 text-chimera-mute">No entry matches your search.</p>}

        <ul className="mt-4 flex flex-col gap-3">
          {visible.map(({ state, index }) => {
            const dirty = JSON.stringify(state.form) !== state.saved;
            const longText = state.form.content.trim().length > ENTRY_SENT_CHARACTERS;
            const fieldId = (name: string) => `${state.key}-${name}`;
            const keywords = parseKeywords(state.form.keywords);
            return (
              <li key={state.key}>
                <details open={state.startOpen} className="rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4">
                  <summary className="cursor-pointer">
                    <span className="flex flex-wrap items-center gap-2">
                      {state.form.isConstant && <Lock size={16} aria-label="Always sent" className="text-chimera-gold" />}
                      <span className="font-serif text-xl font-semibold">{displayName(state.form, index)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold tracking-[0.1em] ${state.form.enabled ? 'border-chimera-mint/50 text-chimera-mint' : 'border-white/20 text-chimera-mute'}`}>{state.form.enabled ? 'ACTIVE' : 'OFF'}</span>
                      {dirty && <span className="text-sm text-chimera-mute">Unsaved</span>}
                    </span>
                    <span className="mt-1 block truncate text-sm text-chimera-mute">
                      {state.form.isConstant ? 'Always sent' : keywords.join(', ') || 'No keyword yet'}
                      {validDepth(state.form.scanDepth) ? ` · Depth: ${state.form.scanDepth}` : ''}
                    </span>
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
                      <span><span className="font-bold">Active</span><span className="block text-sm text-chimera-mute">Turn off to keep it without using it.</span></span>
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
                    <div className="sm:col-span-2">
                      <label htmlFor={fieldId('depth')} className="font-bold">Message depth <span className="font-normal text-chimera-mute">(optional)</span></label>
                      <select
                        id={fieldId('depth')}
                        value={validDepth(state.form.scanDepth) ?? ''}
                        onChange={(e) => edit(state.key, { scanDepth: e.target.value === '' ? null : Number(e.target.value) })}
                        className={`${FIELD} mt-1`}
                      >
                        <option value="">Same as the lorebook ({scanDepth})</option>
                        {Array.from({ length: MAX_SCAN_DEPTH }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? 'message' : 'messages'}</option>
                        ))}
                      </select>
                      <span className="text-sm text-chimera-mute">How many of the latest messages this entry checks for its keywords.</span>
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
        {visible.length < list.length && (
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mt-4 min-h-[44px] rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">
            Show more ({(list.length - visible.length).toLocaleString()} left)
          </button>
        )}
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
                  <CharacterAvatar url={character.avatar_url} name={character.chat_name || 'Character'} size="h-10 w-10" initialSize="text-base" />
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
