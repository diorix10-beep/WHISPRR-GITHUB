import { useState } from 'react';
import { X } from 'lucide-react';
import { LIMITS, parseTags } from '../../lib/characters';

const SUGGESTIONS = ['Original', 'Fandom', 'Slow burn', 'Found family', 'Enemies to lovers', 'Mystery', 'Cozy', 'Adventure', 'Fantasy', 'Sci-Fi', 'Comedy', 'Drama'];

interface Props {
  /** Comma separated, as the form stores them. */
  value: string;
  onChange: (value: string) => void;
}

/** Tags as chips: type one and press Enter (or comma), or tap a suggestion. */
export function TagPicker({ value, onChange }: Props) {
  const [draft, setDraft] = useState('');
  const tags = parseTags(value);
  const full = tags.length >= LIMITS.tags;

  const add = (raw: string) => {
    const next = parseTags([...tags, raw].join(', '));
    onChange(next.join(', '));
    setDraft('');
  };
  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag).join(', '));

  return (
    <div>
      <label htmlFor="c-tag-input" className="font-bold">Tags</label>
      {tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Your tags">
          {tags.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-full border border-chimera-gold/40 bg-chimera-gold/10 py-1 pl-3 pr-1 text-sm">
              {tag}
              <button type="button" onClick={() => remove(tag)} aria-label={`Remove the tag ${tag}`} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10"><X size={14} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        <input
          id="c-tag-input"
          value={draft}
          disabled={full}
          maxLength={LIMITS.tag}
          onChange={(e) => setDraft(e.target.value.replace(',', ''))}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); add(draft); }
          }}
          placeholder={full ? 'That is all the tags a character can have' : 'Add a tag and press Enter'}
          className="w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold disabled:opacity-60"
        />
        <button type="button" onClick={() => draft.trim() && add(draft)} disabled={full || !draft.trim()} className="min-h-[48px] shrink-0 rounded-xl border border-chimera-gold/50 px-4 font-bold hover:bg-chimera-gold/10 disabled:opacity-40">Add</button>
      </div>
      {!full && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Suggested tags">
          {SUGGESTIONS.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())).slice(0, 8).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="min-h-[36px] rounded-full border border-white/15 px-3 text-sm text-violet-100/80 hover:border-chimera-gold hover:text-chimera-gold">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
