import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  COMMUNICATION_KINDS,
  EMPTY_RULES,
  UNIVERSE_LIMITS,
  isEmptyRules,
  normalizeUniverseRules,
  sameRules,
  type CommunicationKind,
  type UniverseRules,
} from '../../../lib/universeRules';
import { loadUniverseRules, saveUniverseRules } from '../../../lib/universeRulesStore';

const inputClass = 'mt-1 min-h-[44px] w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold';

/**
 * What the world of this story is like, in the player's own words: genre, technology, how people can reach each other over
 * distance, how time is counted, customs and laws. It is optional (an empty form changes nothing) and it only describes the
 * setting: it can never change the character's rules or the safety rules. Kept with this scene's other settings, readable
 * only by the player.
 */
export function UniverseSection({ conversationId, userId }: { conversationId: string; userId: string }) {
  const [saved, setSaved] = useState<UniverseRules>(EMPTY_RULES);
  const [draft, setDraft] = useState<UniverseRules>(EMPTY_RULES);
  const [ready, setReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setReady(null);
    const result = await loadUniverseRules(conversationId, userId);
    setSaved(result.rules);
    setDraft(result.rules);
    setReady(result.ready);
  }, [conversationId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (change: Partial<UniverseRules>) => {
    setMessage(null);
    setDraft((current) => ({ ...current, ...change }));
  };
  const setMethod = (index: number, change: Partial<UniverseRules['communications'][number]>) =>
    patch({ communications: draft.communications.map((method, i) => (i === index ? { ...method, ...change } : method)) });

  const save = async (next: UniverseRules) => {
    if (busy || !ready) return;
    setBusy(true);
    setMessage(null);
    try {
      const clean = await saveUniverseRules(conversationId, userId, next);
      setSaved(clean);
      setDraft(clean);
      setMessage({ kind: 'ok', text: isEmptyRules(clean) ? 'Cleared. The story no longer has any world rules.' : 'Saved. The next reply follows these rules.' });
    } catch {
      setMessage({ kind: 'error', text: 'We could not save the universe rules. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (ready === null) return <p role="status" className="text-sm text-chimera-mute">Loading the universe rules…</p>;

  const dirty = !sameRules(draft, saved);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save(normalizeUniverseRules(draft));
      }}
    >
      <p className="text-sm text-chimera-mute">
        Describe the world of this story. It is optional: leave it empty and nothing changes. It only describes the setting, so a world with letters and no phones has no phones.
        It cannot change the character or the safety rules, and only you can read it.
      </p>
      {!ready && (
        <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          We could not read your saved rules, so saving is switched off to protect them.{' '}
          <button type="button" onClick={() => void load()} className="font-bold underline">Try again</button>
        </div>
      )}

      <label className="block text-sm font-bold">
        Genre or kind of story
        <input className={inputClass} value={draft.genre} maxLength={UNIVERSE_LIMITS.genre} onChange={(e) => patch({ genre: e.target.value })} placeholder="Low fantasy, space opera, cosy mystery…" disabled={!ready} />
      </label>
      <label className="block text-sm font-bold">
        Technology
        <input className={inputClass} value={draft.technology} maxLength={UNIVERSE_LIMITS.technology} onChange={(e) => patch({ technology: e.target.value })} placeholder="Swords and sailing ships; no electricity" disabled={!ready} />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-bold">How people reach each other over distance</legend>
        <p className="text-xs text-chimera-mute">
          Only what you list exists in this world for that. Leave the list empty to say nothing about it.
        </p>
        {draft.communications.map((method, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3">
            <div className="flex gap-2">
              <label className="min-w-0 flex-1 text-xs font-bold">
                Name
                <input aria-label={`Name of way ${index + 1}`} className={inputClass} value={method.name} maxLength={UNIVERSE_LIMITS.communicationName} onChange={(e) => setMethod(index, { name: e.target.value })} placeholder="Raven post" disabled={!ready} />
              </label>
              <label className="w-40 shrink-0 text-xs font-bold">
                Kind
                <select aria-label={`Kind of way ${index + 1}`} className={inputClass} value={method.kind} onChange={(e) => setMethod(index, { kind: e.target.value as CommunicationKind })} disabled={!ready}>
                  {COMMUNICATION_KINDS.map((kind) => (
                    <option key={kind.id} value={kind.id}>{kind.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-xs font-bold">
              How it works (optional)
              <input aria-label={`How way ${index + 1} works`} className={inputClass} value={method.note} maxLength={UNIVERSE_LIMITS.communicationNote} onChange={(e) => setMethod(index, { note: e.target.value })} placeholder="A day to cross the valley" disabled={!ready} />
            </label>
            <button
              type="button"
              onClick={() => patch({ communications: draft.communications.filter((_, i) => i !== index) })}
              disabled={!ready}
              aria-label={`Remove ${method.name || 'this way of reaching each other'}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-rose/40 px-4 text-sm font-bold text-chimera-rose hover:bg-chimera-rose/10 disabled:opacity-50"
            >
              <Trash2 size={16} aria-hidden="true" /> Remove
            </button>
          </div>
        ))}
        {draft.communications.length < UNIVERSE_LIMITS.communications && (
          <button
            type="button"
            onClick={() => patch({ communications: [...draft.communications, { name: '', kind: 'letter', note: '' }] })}
            disabled={!ready}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50"
          >
            <Plus size={16} aria-hidden="true" /> Add a way
          </button>
        )}
      </fieldset>

      <label className="block text-sm font-bold">
        How time is counted
        <input className={inputClass} value={draft.calendar} maxLength={UNIVERSE_LIMITS.calendar} onChange={(e) => patch({ calendar: e.target.value })} placeholder="Twelve moons a year; leave empty if time is not tracked" disabled={!ready} />
      </label>
      <label className="block text-sm font-bold">
        Customs and laws
        <textarea className={`${inputClass} min-h-[88px]`} value={draft.customs} maxLength={UNIVERSE_LIMITS.customs} onChange={(e) => patch({ customs: e.target.value })} placeholder="Magic is licensed by the guild; duels are legal" disabled={!ready} />
        <span className="text-xs font-normal text-chimera-mute">{draft.customs.length} / {UNIVERSE_LIMITS.customs}</span>
      </label>

      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${message.kind === 'error' ? 'text-chimera-rose' : 'text-emerald-300'}`}>{message.text}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !ready || !dirty} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">
          {busy ? 'Saving…' : 'Save the universe'}
        </button>
        <button
          type="button"
          onClick={() => void save(EMPTY_RULES)}
          disabled={busy || !ready || isEmptyRules(saved)}
          className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50"
        >
          Clear everything
        </button>
      </div>
    </form>
  );
}
