import { useMemo, useState } from 'react';
import { createLorebookWithEntries, EMPTY_ENTRY, parseKeywords, type EntryForm } from '../../lib/lorebooks';
import {
  ALWAYS_SEND_BUDGET,
  SPLIT_CHUNK_CHARACTERS,
  buildDrafts,
  defaultStyle,
  detectStyles,
  type HeadingStyle,
} from '../../lib/lorebookSplit';

const FIELD = 'w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-2.5 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';
const PAGE = 40;

interface Row {
  key: number;
  title: string;
  keywords: string;
  content: string;
  isConstant: boolean;
}

export interface ConvertedLorebook {
  lorebookId: string;
  title: string;
  count: number;
}

interface Props {
  userId: string;
  /** The text to turn into a lorebook. */
  text: string;
  defaultName: string;
  onCancel: () => void;
  onDone: (result: ConvertedLorebook) => void;
}

function rowsFor(text: string, style: HeadingStyle): Row[] {
  return buildDrafts(text, style).map((draft, index) => ({ key: index, ...draft }));
}

function toForm(row: Row): EntryForm {
  return { ...EMPTY_ENTRY, title: row.title, keywords: row.keywords, content: row.content, isConstant: row.isConstant };
}

/**
 * Turns a long text into a lorebook, with a review step: the writer picks how the text is cut, sees every entry, edits
 * names and keywords, ticks which ones are "always send", and only then is anything saved.
 */
export function LorebookConverter({ userId, text, defaultName, onCancel, onDone }: Props) {
  const styles = useMemo(() => detectStyles(text), [text]);
  const [style, setStyle] = useState<HeadingStyle>(() => defaultStyle(styles));
  const [rows, setRows] = useState<Row[]>(() => rowsFor(text, defaultStyle(styles)));
  const [name, setName] = useState(defaultName);
  const [shown, setShown] = useState(PAGE);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => [...styles.map((s) => ({ style: s.style, label: s.label, detail: `${s.count} headings, for example “${s.example}”` })),
      { style: 'none' as HeadingStyle, label: 'No headings: cut by size only', detail: 'Parts of about 2,400 characters, named Part 1, Part 2…' }]
      .map((option) => ({ ...option, entries: buildDrafts(text, option.style).length })),
    [styles, text],
  );

  const chooseStyle = (next: HeadingStyle) => {
    setStyle(next);
    setRows(rowsFor(text, next));
    setShown(PAGE);
    setError(null);
  };

  const patch = (key: number, change: Partial<Row>) => setRows((all) => all.map((row) => (row.key === key ? { ...row, ...change } : row)));
  const remove = (key: number) => setRows((all) => all.filter((row) => row.key !== key));

  const missing = (row: Row) => !row.isConstant && parseKeywords(row.keywords).length === 0;
  const problems = rows.filter(missing);
  const alwaysChars = rows.filter((row) => row.isConstant).reduce((total, row) => total + Math.min(row.content.length, SPLIT_CHUNK_CHARACTERS + 100), 0);
  const visible = (onlyProblems ? problems : rows).slice(0, shown);
  const total = onlyProblems ? problems.length : rows.length;

  const fillMissing = () => setRows((all) => all.map((row) => (missing(row) ? { ...row, keywords: row.title.replace(/\s*\(\d+\)$/, '').slice(0, 60) } : row)));

  const confirm = async () => {
    if (busy || rows.length === 0 || problems.length > 0) return;
    setBusy(true);
    setError(null);
    try {
      const lorebookId = await createLorebookWithEntries(userId, name.trim() || defaultName, rows.map(toForm));
      onDone({ lorebookId, title: name.trim() || defaultName, count: rows.length });
    } catch {
      setError('We could not create the lorebook. Nothing was changed and your text is still in the field. Please try again.');
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="conv-title" className="mt-4 rounded-2xl border border-chimera-gold/40 bg-chimera-panel2 p-4 sm:p-5">
      <h3 id="conv-title" className="font-serif text-2xl font-semibold text-chimera-gold">Turn this text into a lorebook</h3>
      <p className="mt-1 text-sm text-chimera-mute">
        The text is cut into entries. Only the entries whose keywords come up in the scene (and the ones you mark &quot;Always send&quot;) go to the AI with each reply, so a very long text no longer weighs on every answer. Nothing is saved until you press Create, and you can cancel to keep the text as it is.
      </p>

      <fieldset className="mt-4">
        <legend className="font-bold">How is your text organised?</legend>
        <div className="mt-2 space-y-2">
          {options.map((option) => (
            <label key={option.style} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${style === option.style ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/25'}`}>
              <input type="radio" name="conv-style" checked={style === option.style} onChange={() => chooseStyle(option.style)} className="mt-1" />
              <span>
                <span className="font-bold">{option.label}</span>
                <span className="block text-sm text-chimera-mute">{option.detail} · gives {option.entries.toLocaleString()} {option.entries === 1 ? 'entry' : 'entries'}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-chimera-mute">Changing this starts the entries over.</p>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="conv-name" className="font-bold">Name of the lorebook</label>
        <input id="conv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={`${FIELD} mt-2`} />
      </div>

      <div className="mt-4 rounded-xl border border-chimera-gold/20 p-3 text-sm">
        <p><span className="font-bold">{rows.length.toLocaleString()}</span> {rows.length === 1 ? 'entry' : 'entries'}. Always sent: <span className="font-bold">{rows.filter((r) => r.isConstant).length}</span> ({alwaysChars.toLocaleString()} characters).</p>
        {alwaysChars > ALWAYS_SEND_BUDGET && (
          <p role="alert" className="mt-1 text-amber-200">The always-sent entries are more than the {ALWAYS_SEND_BUDGET.toLocaleString()} characters a reply can carry. The lowest priority ones will be left out. Untick some.</p>
        )}
        {problems.length > 0 && (
          <p role="alert" className="mt-1 text-rose-200">
            {problems.length.toLocaleString()} {problems.length === 1 ? 'entry needs' : 'entries need'} a keyword or &quot;Always send&quot;.{' '}
            <button type="button" onClick={fillMissing} className="font-bold underline">Use their name as keyword</button>{' · '}
            <button type="button" onClick={() => setOnlyProblems((v) => !v)} className="font-bold underline">{onlyProblems ? 'Show all' : 'Show only those'}</button>
          </p>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {visible.map((row) => (
          <li key={row.key} className={`rounded-xl border p-3 ${missing(row) ? 'border-chimera-rose/50' : 'border-chimera-gold/20'}`}>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={row.isConstant} onChange={(e) => patch(row.key, { isConstant: e.target.checked })} className="h-5 w-5 accent-[#e8c27a]" />
                Always send
              </label>
              <span className="text-xs text-chimera-mute">{row.content.length.toLocaleString()} characters</span>
              <button type="button" onClick={() => remove(row.key)} className="ml-auto min-h-[36px] rounded-full px-3 text-sm text-chimera-mute hover:text-chimera-rose" aria-label={`Remove ${row.title}`}>Remove</button>
            </div>
            <label className="mt-2 block text-sm font-bold" htmlFor={`conv-t-${row.key}`}>Name</label>
            <input id={`conv-t-${row.key}`} value={row.title} onChange={(e) => patch(row.key, { title: e.target.value })} maxLength={100} className={FIELD} />
            <label className="mt-2 block text-sm font-bold" htmlFor={`conv-k-${row.key}`}>Keywords</label>
            <input id={`conv-k-${row.key}`} value={row.keywords} onChange={(e) => patch(row.key, { keywords: e.target.value })} className={FIELD} placeholder={row.isConstant ? 'Not needed: always sent' : 'Words that bring this into the story, separated by commas'} />
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-chimera-mute">Read the text: {row.content.slice(0, 70).replace(/\s+/g, ' ')}…</summary>
              <p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-line break-words text-sm text-violet-100/85">{row.content}</p>
            </details>
          </li>
        ))}
      </ul>
      {visible.length < total && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mt-3 min-h-[44px] rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">
          Show more ({(total - visible.length).toLocaleString()} left)
        </button>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-[15px] text-rose-100">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void confirm()} disabled={busy || rows.length === 0 || problems.length > 0} className="inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? 'Creating…' : `Create the lorebook (${rows.length.toLocaleString()} ${rows.length === 1 ? 'entry' : 'entries'})`}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="min-h-[48px] rounded-full px-4 text-chimera-mute hover:text-chimera-ink disabled:opacity-50">Cancel, keep the text</button>
      </div>
    </section>
  );
}
