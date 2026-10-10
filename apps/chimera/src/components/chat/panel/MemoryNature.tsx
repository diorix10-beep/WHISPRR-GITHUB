import { useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { CERTAINTIES, KNOWN_BY, canBeEverywhere, type KnownBy, type MemoryCertainty } from '../../../lib/memoryCertainty';

const selectClass = 'mt-1 min-h-[44px] w-full rounded-lg border border-chimera-gold/25 bg-chimera-panel px-3 text-base text-chimera-ink outline-none focus:border-chimera-gold';

/** Small labels for a memory that is not the ordinary "confirmed, the character knows it". Nothing is shown for an ordinary one. */
export function MemoryTags({ certainty, knownBy }: { certainty: MemoryCertainty; knownBy: KnownBy }) {
  const tags = [
    certainty !== 'canon' ? { key: certainty, text: CERTAINTIES.find((c) => c.id === certainty)?.label ?? certainty, tone: certainty === 'assumption' ? 'border-amber-400/50 text-amber-200' : 'border-sky-400/50 text-sky-200' } : null,
    knownBy === 'player' ? { key: 'player', text: 'Only me', tone: 'border-violet-400/50 text-violet-200' } : null,
  ].filter((tag): tag is { key: string; text: string; tone: string } => tag !== null);
  if (tags.length === 0) return null;
  return (
    <span className="mr-2 inline-flex flex-wrap gap-1 align-middle">
      {tags.map((tag) => (
        <span key={tag.key} className={`rounded-full border px-2 py-0.5 text-xs font-bold ${tag.tone}`}>{tag.text}</span>
      ))}
    </span>
  );
}

/** The two choices as two labelled lists, for the form that adds a memory. The hint under each says what the choice means. */
export function MemoryNatureFields({ certainty, knownBy, scopeIsEverywhere, onCertainty, onKnownBy, characterName }: {
  certainty: MemoryCertainty;
  knownBy: KnownBy;
  /** When the memory is meant for every chat, only a confirmed one is allowed. */
  scopeIsEverywhere: boolean;
  onCertainty: (value: MemoryCertainty) => void;
  onKnownBy: (value: KnownBy) => void;
  characterName: string;
}) {
  const id = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${id}-certainty`} className="block text-xs font-bold text-chimera-gold">How sure</label>
        <select id={`${id}-certainty`} value={certainty} onChange={(e) => onCertainty(e.target.value as MemoryCertainty)} className={selectClass}>
          {CERTAINTIES.map((c) => (
            <option key={c.id} value={c.id} disabled={scopeIsEverywhere && !canBeEverywhere(c.id)}>{c.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-chimera-mute">{CERTAINTIES.find((c) => c.id === certainty)?.hint}</p>
      </div>
      <div>
        <label htmlFor={`${id}-known`} className="block text-xs font-bold text-chimera-gold">Who knows</label>
        <select id={`${id}-known`} value={knownBy} onChange={(e) => onKnownBy(e.target.value as KnownBy)} className={selectClass}>
          {KNOWN_BY.map((k) => (
            <option key={k.id} value={k.id}>{k.id === 'character' ? `${characterName} knows` : k.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-chimera-mute">{KNOWN_BY.find((k) => k.id === knownBy)?.hint}</p>
      </div>
    </div>
  );
}

/** Changes the two choices of a memory that is already kept. Closed by default so the list stays calm. */
export function MemoryNatureEditor({ certainty, knownBy, isEverywhere, disabled, onChange, characterName }: {
  certainty: MemoryCertainty;
  knownBy: KnownBy;
  isEverywhere: boolean;
  disabled: boolean;
  onChange: (patch: { certainty?: MemoryCertainty; knownBy?: KnownBy }) => void;
  characterName: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={id} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/30 px-4 text-xs font-bold hover:bg-chimera-gold/10">
        <SlidersHorizontal size={14} aria-hidden="true" /> How sure, who knows
      </button>
      {open && (
        <div id={id} className="mt-2 grid gap-3 rounded-xl border border-chimera-gold/15 bg-chimera-bg p-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-c`} className="block text-xs font-bold text-chimera-gold">How sure</label>
            <select id={`${id}-c`} value={certainty} disabled={disabled} onChange={(e) => onChange({ certainty: e.target.value as MemoryCertainty })} className={selectClass}>
              {CERTAINTIES.map((c) => (
                <option key={c.id} value={c.id} disabled={isEverywhere && !canBeEverywhere(c.id)}>{c.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-chimera-mute">
              {isEverywhere && certainty === 'canon' ? 'Kept for every chat, so it can only be confirmed. To mark it temporary or an assumption, keep it for this chat only first.' : CERTAINTIES.find((c) => c.id === certainty)?.hint}
            </p>
          </div>
          <div>
            <label htmlFor={`${id}-k`} className="block text-xs font-bold text-chimera-gold">Who knows</label>
            <select id={`${id}-k`} value={knownBy} disabled={disabled} onChange={(e) => onChange({ knownBy: e.target.value as KnownBy })} className={selectClass}>
              {KNOWN_BY.map((k) => (
                <option key={k.id} value={k.id}>{k.id === 'character' ? `${characterName} knows` : k.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-chimera-mute">{KNOWN_BY.find((k) => k.id === knownBy)?.hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}
