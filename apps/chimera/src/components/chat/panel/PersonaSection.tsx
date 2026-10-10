import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { PersonaSummary } from '../../../lib/personas';
import { radioGroupKeys } from '../../../lib/radioKeys';

/**
 * Who the player is in this chat. Until the first message the choice is free; after that it is fixed, so the character
 * always knows who it has been talking to and earlier messages are never rewritten. Creating or editing a persona opens
 * the personas screens; the chat is saved as it is.
 */
export function PersonaSection({ personas, personaId, locked, botName, onChoose, onNewChat }: {
  personas: PersonaSummary[];
  personaId: string | null;
  locked: boolean;
  botName: string;
  onChoose: (id: string | null) => void;
  onNewChat: () => void;
}) {
  const current = personas.find((p) => p.id === personaId) ?? null;
  const options: Array<{ id: string | null; name: string; hint: string }> = [
    ...personas.map((p) => ({ id: p.id, name: p.name, hint: p.description?.trim() || (p.is_default ? 'Your default persona' : '') })),
    { id: null, name: 'Myself, no persona', hint: `${botName} only knows what you tell them in the story` },
  ];
  return (
    <div className="space-y-4">
      {locked ? (
        <div className="rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3">
          <p className="text-xs font-bold tracking-[0.1em] text-chimera-gold">PLAYING AS</p>
          <p className="mt-1 text-lg font-bold">{current?.name ?? 'Yourself'}</p>
          <p className="mt-2 text-sm text-chimera-mute">
            This is fixed once the story has begun, so {botName} always knows who you are and earlier messages never change. To play as someone else, start a new chat.
          </p>
          <button type="button" onClick={onNewChat} className="mt-3 min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Start a new chat</button>
        </div>
      ) : (
        <div role="radiogroup" aria-label="Playing as" onKeyDown={radioGroupKeys} className="space-y-2">
          {options.map((option) => {
            const selected = (option.id ?? null) === (personaId ?? null);
            return (
              <button
                key={option.id ?? 'none'}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => !selected && onChoose(option.id)}
                className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold ${selected ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/25 hover:border-chimera-gold/60'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{option.name}</span>
                  {option.hint && <span className="block truncate text-xs text-chimera-mute">{option.hint}</span>}
                </span>
                {selected && <Check size={18} className="shrink-0 text-chimera-gold" aria-hidden="true" />}
              </button>
            );
          })}
          <p className="text-xs text-chimera-mute">You can change this until you send your first message.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/personas/new" className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Create a persona</Link>
        {current && <Link to={`/personas/${current.id}`} className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Edit {current.name}</Link>}
        <Link to="/personas" className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">All personas</Link>
      </div>
      {personas.length === 0 && <p className="text-sm text-chimera-mute">You have no persona yet. Create one to tell {botName} who you are: a name, a look, a past.</p>}
    </div>
  );
}
