import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CharacterAvatar } from '../../characters/CharacterAvatar';
import { loadCharacterInfo, type CharacterInfo } from '../../../lib/characterInfo';
import { ratingLabel } from '../../../lib/ratings';

const VISIBILITY: Record<string, string> = { public: 'Public', unlisted: 'Unlisted', private: 'Private' };

/** The character of this chat: who made them, who can see them, and the public description. Read only. */
export function AboutSection({ characterId, viewerId, fallbackName }: { characterId: string; viewerId: string; fallbackName: string }) {
  const [info, setInfo] = useState<CharacterInfo | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'gone' | 'failed'>('loading');

  useEffect(() => {
    let active = true;
    setState('loading');
    loadCharacterInfo(characterId, viewerId).then(
      (found) => {
        if (!active) return;
        setInfo(found);
        setState(found ? 'ready' : 'gone');
      },
      () => active && setState('failed'),
    );
    return () => {
      active = false;
    };
  }, [characterId, viewerId]);

  if (state === 'loading') return <p className="text-sm text-chimera-mute" role="status">Loading…</p>;
  if (state === 'failed') return <p role="note" className="text-sm text-amber-200">We could not load this character right now. Please try again in a moment.</p>;
  if (state === 'gone' || !info) {
    return (
      <p role="note" className="rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3 text-sm text-chimera-mute">
        {fallbackName}&apos;s page is not available to you any more, for example because the creator made the character private. Your chat and its messages are unchanged.
      </p>
    );
  }
  // Only the creator sees the visibility of their own character, as on its page; everyone else only needs to know it is open to them.
  const visibility = info.mine && info.visibility ? VISIBILITY[info.visibility] ?? info.visibility : null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <CharacterAvatar url={info.avatarUrl} name={info.name} size="h-16 w-16" initialSize="text-2xl" />
        <div className="min-w-0">
          <p className="truncate font-serif text-2xl font-semibold">{info.name}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.1em]">
            <span className="rounded-full border border-chimera-gold/40 px-2.5 py-1 text-chimera-gold">{ratingLabel(info.rating)}</span>
            {visibility && <span className="rounded-full border border-white/20 px-2.5 py-1 text-violet-100/80">{visibility}</span>}
          </div>
        </div>
      </div>
      <dl className="text-sm">
        <dt className="text-xs font-bold tracking-[0.1em] text-chimera-gold">CREATED BY</dt>
        <dd className="mt-1">{info.mine ? 'You' : info.creatorName ?? 'A CHIMERA creator'}</dd>
      </dl>
      {info.shortDescription && <p className="text-base text-chimera-ink">{info.shortDescription}</p>}
      {info.longDescription && (
        <details className="rounded-xl border border-chimera-gold/15 bg-chimera-bg p-3">
          <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-bold">Full description</summary>
          <p className="whitespace-pre-wrap text-sm text-chimera-ink">{info.longDescription}</p>
        </details>
      )}
      <Link to={`/characters/${info.id}`} className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Open the character page</Link>
    </div>
  );
}
