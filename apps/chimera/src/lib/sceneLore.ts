import { supabase } from './supabase';
import {
  LOREBOOK_BUDGET_CHARACTERS,
  LOREBOOK_MAX_ENTRIES_READ,
  LOREBOOK_READ_PAGE,
  lorebookBlock,
  selectLorebookEntries,
  validBudget,
  validDepth,
  type LorebookEntry,
} from '../../api/_lib/lorebook.ts';

/** A lorebook linked to the character of a chat, as the panel shows it. */
export interface CharacterLorebook {
  id: string;
  title: string;
  description: string;
  visibility: string;
  entryCount: number;
  /** How many of the latest messages it searches for keywords, or null for the default. */
  depth: number | null;
  /** Characters of lore one reply may carry from this lorebook, or null for the default. */
  budget: number | null;
  /** The viewer wrote it, so they may open it, link it and unlink it. */
  mine: boolean;
}

/**
 * The lorebooks linked to a character that this viewer may be shown: their own, and public ones.
 * Someone else's private lorebook is not shown (and neither is its content): the character still uses it for every chat.
 */
export async function loadCharacterLorebooks(characterId: string, viewerId: string): Promise<CharacterLorebook[]> {
  const links = await supabase.from('lorebook_characters').select('lorebook_id').eq('character_id', characterId);
  if (links.error) throw links.error;
  const ids = ((links.data ?? []) as Array<{ lorebook_id: string }>).map((row) => row.lorebook_id);
  if (ids.length === 0) return [];
  // `*`: a column added later (or missing on an older lorebook) must never make the read fail.
  const { data, error } = await supabase.from('lorebooks').select('*').in('id', ids).order('title', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>)
    // Only public lorebooks are shown to others: "unlisted" ones are readable by link, not meant to be advertised in someone's chat.
    .filter((row) => row.user_id === viewerId || row.visibility === 'public')
    .map((row) => ({
      id: String(row.id),
      title: typeof row.title === 'string' && row.title.trim() ? row.title : 'Untitled lorebook',
      description: typeof row.description === 'string' ? row.description : '',
      visibility: typeof row.visibility === 'string' ? row.visibility : 'private',
      entryCount: typeof row.entry_count === 'number' ? row.entry_count : 0,
      depth: validDepth(row.scan_depth),
      budget: validBudget(row.reply_budget),
      mine: row.user_id === viewerId,
    }));
}

/** Stops a character of the member from using one of the member's lorebooks (the lorebook itself is kept). */
export async function unlinkLorebookFromCharacter(lorebookId: string, characterId: string): Promise<void> {
  const { data, error } = await supabase.from('lorebook_characters').delete().eq('lorebook_id', lorebookId).eq('character_id', characterId).select('id');
  if (error || !data || data.length === 0) throw error ?? new Error('Not allowed');
}

/** The enabled entries of the member's own lorebooks, highest priority first, in pages, like the server reads them. */
export async function loadEnabledEntries(lorebookIds: string[]): Promise<LorebookEntry[]> {
  const entries: LorebookEntry[] = [];
  if (lorebookIds.length === 0) return entries;
  for (let from = 0; from < LOREBOOK_MAX_ENTRIES_READ; from += LOREBOOK_READ_PAGE) {
    const { data, error } = await supabase
      .from('lorebook_entries')
      .select('*')
      .in('lorebook_id', lorebookIds)
      .eq('enabled', true)
      .order('priority', { ascending: false })
      .order('insertion_order', { ascending: true })
      .order('id', { ascending: true })
      .range(from, Math.min(from + LOREBOOK_READ_PAGE, LOREBOOK_MAX_ENTRIES_READ) - 1);
    // A failed page means no answer at all: a partial list would say a piece of lore is not in play when it is.
    if (error || !Array.isArray(data)) throw error ?? new Error('Entries unavailable');
    entries.push(...(data as LorebookEntry[]));
    if (data.length < LOREBOOK_READ_PAGE) break;
  }
  return entries;
}

export interface InPlay {
  /** The entries the next reply would carry, in the order they would be sent. */
  entries: LorebookEntry[];
  /** Characters of lore that would be sent, and the room a reply has for it. */
  sent: number;
  budget: number;
}

/**
 * What the character would be given from these lorebooks if a reply were asked for now. It uses the very same selection as the
 * server (api/_lib/lorebook.ts): the lorebooks' depths, the "always on" entries, the keywords in the latest messages and the
 * reply size (the largest one asked for by the lorebooks, otherwise the default).
 */
export function whatIsInPlay(entries: LorebookEntry[], books: CharacterLorebook[], recentMessages: string[]): InPlay {
  const bookDepths = new Map<string, number>();
  let budget = LOREBOOK_BUDGET_CHARACTERS;
  let asked = false;
  for (const book of books) {
    if (book.depth) bookDepths.set(book.id, book.depth);
    if (book.budget && (!asked || book.budget > budget)) {
      budget = book.budget;
      asked = true;
    }
  }
  const picked = selectLorebookEntries(entries, recentMessages, { bookDepths, budget });
  return { entries: picked, sent: lorebookBlock(picked, budget)?.length ?? 0, budget };
}
