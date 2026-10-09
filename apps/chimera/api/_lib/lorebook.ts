/**
 * Lorebooks: notes about a world that the AI only sees when they matter.
 *
 * A lorebook belongs to a creator and is linked to that creator's characters. Each entry has keywords; an entry
 * is sent with a reply only when one of its keywords shows up in the latest messages, or when it is marked
 * "always on". Everything sent is capped so a big lorebook can never crowd out the character or the story.
 * Nothing here talks to the database or the network.
 */

/** Characters of lorebook text sent with one reply, in total. */
export const LOREBOOK_BUDGET_CHARACTERS = 8_000;
/** One entry is cut at this length when it is sent (the full text stays saved). */
export const LOREBOOK_ENTRY_MAX_CHARACTERS = 2_500;
/** How many of the latest messages are searched for keywords. */
export const LOREBOOK_SCAN_MESSAGES = 6;
/**
 * The most entries ever read for one character, a safety bound for the database read. They are read highest priority
 * first, so if a character somehow has more than this, it is the lowest-priority ones that are left out.
 */
export const LOREBOOK_MAX_ENTRIES_READ = 2_000;
/** Entries read per request to the database. */
export const LOREBOOK_READ_PAGE = 500;

export interface LorebookEntry {
  id: string;
  title: string | null;
  content: string | null;
  keywords: string[] | null;
  is_constant: boolean | null;
  case_sensitive: boolean | null;
  enabled: boolean | null;
  priority: number | null;
  insertion_order: number | null;
}

function keywordsOf(entry: LorebookEntry): string[] {
  return (Array.isArray(entry.keywords) ? entry.keywords : [])
    .filter((keyword): keyword is string => typeof keyword === 'string')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

/** True when one of the entry's keywords appears in the text (case-insensitive unless the entry says otherwise). */
export function entryMatches(entry: LorebookEntry, text: string): boolean {
  const keywords = keywordsOf(entry);
  if (keywords.length === 0 || !text) return false;
  const haystack = entry.case_sensitive ? text : text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(entry.case_sensitive ? keyword : keyword.toLowerCase()));
}

/**
 * Picks the entries to send. Disabled entries and entries without any text are never sent. "Always on" entries
 * and entries whose keyword was just mentioned compete for the budget by priority (higher first), then by the
 * order the creator gave them. An entry that does not fit is skipped, a smaller one after it still can.
 */
export function selectLorebookEntries(
  entries: LorebookEntry[],
  recentMessages: string[],
  options: { budget?: number; scan?: number } = {},
): LorebookEntry[] {
  const budget = options.budget ?? LOREBOOK_BUDGET_CHARACTERS;
  const scan = options.scan ?? LOREBOOK_SCAN_MESSAGES;
  const scanned = recentMessages.slice(-scan).join('\n');

  const candidates = entries
    .filter((entry) => entry.enabled !== false && (entry.content ?? '').trim().length > 0)
    .filter((entry) => entry.is_constant === true || entryMatches(entry, scanned))
    .sort((a, b) =>
      (b.priority ?? 0) - (a.priority ?? 0)
      || (a.insertion_order ?? 0) - (b.insertion_order ?? 0)
      || (a.title ?? '').localeCompare(b.title ?? ''));

  const picked: LorebookEntry[] = [];
  let used = 0;
  for (const entry of candidates) {
    const size = Math.min((entry.content ?? '').trim().length, LOREBOOK_ENTRY_MAX_CHARACTERS) + (entry.title ?? '').trim().length;
    if (used + size > budget) continue;
    picked.push(entry);
    used += size;
  }
  return picked;
}

/** The block added to the character's prompt, or null when nothing applies. */
export function lorebookBlock(entries: LorebookEntry[]): string | null {
  if (entries.length === 0) return null;
  const lines = entries.map((entry) => {
    const content = (entry.content ?? '').trim();
    const text = content.length > LOREBOOK_ENTRY_MAX_CHARACTERS ? `${content.slice(0, LOREBOOK_ENTRY_MAX_CHARACTERS)}…` : content;
    const title = (entry.title ?? '').trim();
    return title ? `### ${title}\n${text}` : text;
  });
  return [
    '## Lorebook',
    'Background about this world and its people, relevant to what was just said. Treat it as true. Use it naturally, do not recite it, and never mention this block:',
    ...lines,
  ].join('\n\n');
}
