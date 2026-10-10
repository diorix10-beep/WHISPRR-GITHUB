import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Link2, Unlink } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { linkLorebookToCharacter, loadMyLorebooks, type LorebookSummary } from '../../../lib/lorebooks';
import {
  loadCharacterLorebooks,
  loadEnabledEntries,
  unlinkLorebookFromCharacter,
  whatIsInPlay,
  type CharacterLorebook,
  type InPlay,
} from '../../../lib/sceneLore';

const VISIBILITY: Record<string, string> = { private: 'Private', unlisted: 'Unlisted', public: 'Public' };

/**
 * The lore a character draws on, from inside the chat. The creator can open, link and unlink their lorebooks and check
 * what the next reply would carry; everyone else sees the lorebooks the creator made public, and a note that private ones
 * exist. A lorebook belongs to its character, never to a chat, so one story's lore cannot leak into another character's.
 */
export function LorebookSection({ characterId, characterName, viewerId, isCreator, recentMessages }: {
  characterId: string;
  characterName: string;
  viewerId: string;
  isCreator: boolean;
  /** The latest messages, oldest first, as the server would read them. Asked for only when the player checks what is in play. */
  recentMessages: () => string[];
}) {
  const { showToast } = useToast();
  const [books, setBooks] = useState<CharacterLorebook[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [mine, setMine] = useState<LorebookSummary[]>([]);
  // The creator's own library could not be read: linking is unavailable then, and the screen must say so instead of looking empty.
  const [mineFailed, setMineFailed] = useState(false);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [play, setPlay] = useState<InPlay | null>(null);
  const [playState, setPlayState] = useState<'idle' | 'busy' | 'failed'>('idle');

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const linked = await loadCharacterLorebooks(characterId, viewerId);
      setBooks(linked);
      if (isCreator) {
        try {
          setMine(await loadMyLorebooks(viewerId));
          setMineFailed(false);
        } catch {
          setMineFailed(true);
        }
      }
    } catch {
      setFailed(true);
    }
  }, [characterId, viewerId, isCreator]);

  useEffect(() => {
    void load();
  }, [load]);

  const linkedIds = new Set((books ?? []).map((b) => b.id));
  const available = mine.filter((b) => !linkedIds.has(b.id));

  const link = async () => {
    if (!choice || busy) return;
    setBusy(true);
    try {
      await linkLorebookToCharacter(choice, characterId);
      setChoice('');
      setPlay(null);
      await load();
      showToast(`Linked. ${characterName} can use it in every chat from the next reply.`, 'success');
    } catch {
      showToast('We could not link this lorebook. Nothing was changed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const unlink = async (book: CharacterLorebook) => {
    if (busy) return;
    setBusy(true);
    try {
      await unlinkLorebookFromCharacter(book.id, characterId);
      setPlay(null);
      await load();
      showToast(`Unlinked. “${book.title}” is kept; ${characterName} stops using it from the next reply.`, 'success');
    } catch {
      showToast('We could not unlink this lorebook. Nothing was changed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (!books || playState === 'busy') return;
    const own = books.filter((b) => b.mine);
    setPlayState('busy');
    try {
      const entries = await loadEnabledEntries(own.map((b) => b.id));
      setPlay(whatIsInPlay(entries, own, recentMessages()));
      setPlayState('idle');
    } catch {
      setPlay(null);
      setPlayState('failed');
    }
  };

  if (failed) {
    return (
      <div className="space-y-3">
        <p role="note" className="text-sm text-amber-200">We could not load the lorebooks right now. Your chat is not affected.</p>
        <button type="button" onClick={() => void load()} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Try again</button>
      </div>
    );
  }
  if (!books) return <p className="text-sm text-chimera-mute" role="status">Loading…</p>;
  const ownBooks = books.filter((b) => b.mine);

  return (
    <div className="space-y-4">
      <p className="text-sm text-chimera-mute">
        A lorebook holds notes about the world. {characterName} only sees an entry when it matters: when one of its keywords comes up in the latest messages, or when it is marked always on. A lorebook belongs to the character, so lore from one character&apos;s chats never reaches another&apos;s.
      </p>

      {books.length === 0 ? (
        <p className="rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3 text-sm text-chimera-mute">
          {isCreator ? `No lorebook is linked to ${characterName} yet.` : `${characterName} has no public lorebook. Their creator may still use private notes that only the creator can see.`}
        </p>
      ) : (
        <ul className="space-y-2" aria-label={`Lorebooks of ${characterName}`}>
          {books.map((book) => (
            <li key={book.id} className="rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3">
              <div className="flex items-start gap-2">
                <BookOpen size={18} className="mt-0.5 shrink-0 text-chimera-gold" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{book.title}</p>
                  <p className="text-xs text-chimera-mute">
                    {book.entryCount} {book.entryCount === 1 ? 'entry' : 'entries'}
                    {book.mine && ` · ${VISIBILITY[book.visibility] ?? book.visibility}`}
                    {book.depth ? ` · searches the last ${book.depth} ${book.depth === 1 ? 'message' : 'messages'}` : ''}
                    {book.budget ? ` · up to ${book.budget.toLocaleString()} characters a reply` : ''}
                  </p>
                  {book.description && <p className="mt-1 line-clamp-2 text-sm text-chimera-ink">{book.description}</p>}
                </div>
              </div>
              {book.mine && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to={`/lorebooks/${book.id}`} className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-4 text-sm font-bold hover:bg-chimera-gold/10">Open the editor</Link>
                  <button type="button" onClick={() => void unlink(book)} disabled={busy} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-rose/40 px-4 text-sm font-bold text-chimera-rose hover:bg-chimera-rose/10 disabled:opacity-50">
                    <Unlink size={16} aria-hidden="true" /> Unlink
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isCreator && (
        <div className="space-y-3 border-t border-chimera-gold/15 pt-4">
          <div>
            <label htmlFor="link-lorebook" className="block text-sm font-bold">Link one of your lorebooks</label>
            <p className="mt-1 text-xs text-chimera-mute">It applies to every chat with {characterName}, from the next reply.</p>
            {mineFailed && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p role="note" className="text-sm text-amber-200">We could not load your lorebooks, so linking is unavailable for now.</p>
                <button type="button" onClick={() => void load()} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Try again</button>
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <select id="link-lorebook" value={choice} onChange={(e) => setChoice(e.target.value)} disabled={available.length === 0 || busy || mineFailed} className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-chimera-gold/25 bg-chimera-bg px-3 text-base text-chimera-ink outline-none focus:border-chimera-gold disabled:opacity-50">
                <option value="">{mineFailed ? 'Unavailable right now' : available.length === 0 ? 'No other lorebook to link' : 'Choose a lorebook'}</option>
                {available.map((b) => <option key={b.id} value={b.id}>{b.title || 'Untitled lorebook'}</option>)}
              </select>
              <button type="button" onClick={() => void link()} disabled={!choice || busy} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">
                <Link2 size={16} aria-hidden="true" /> Link
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/lorebooks/new" className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Create a lorebook</Link>
            <Link to="/lorebooks" className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">All my lorebooks</Link>
          </div>

          {ownBooks.length > 0 && (
            <div className="space-y-2 rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3">
              <p className="text-sm font-bold">What is in play now</p>
              <p className="text-xs text-chimera-mute">Checks which entries {characterName} would be given for the next reply, using the same rules as a real reply and the latest messages of this chat.</p>
              <button type="button" onClick={() => void check()} disabled={playState === 'busy'} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50">{playState === 'busy' ? 'Checking…' : 'Check now'}</button>
              {playState === 'failed' && <p role="note" className="text-sm text-amber-200">We could not read the entries right now. Please try again.</p>}
              {play && (
                play.entries.length === 0 ? (
                  <p className="text-sm text-chimera-mute" role="status">Nothing from your lorebooks matches the latest messages, so none of it would be sent.</p>
                ) : (
                  <div role="status">
                    <p className="text-sm">{play.entries.length} {play.entries.length === 1 ? 'entry' : 'entries'} would be sent, about {play.sent.toLocaleString()} of {play.budget.toLocaleString()} characters.</p>
                    <ul className="mt-2 space-y-1" aria-label="Entries in play">
                      {play.entries.map((entry) => (
                        <li key={entry.id} className="flex items-center gap-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">{(entry.title ?? '').trim() || (entry.keywords ?? [])[0] || 'Entry'}</span>
                          <span className="shrink-0 rounded-full border border-chimera-gold/30 px-2 py-0.5 text-[11px] font-bold text-chimera-gold">{entry.is_constant ? 'Always on' : 'Keyword'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
