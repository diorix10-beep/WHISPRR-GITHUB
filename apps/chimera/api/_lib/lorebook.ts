/**
 * Lorebooks: notes about a world that the AI only sees when they matter.
 *
 * A lorebook belongs to a creator and is linked to that creator's characters. Each entry has keywords; an entry
 * is sent with a reply only when one of its keywords shows up in the latest messages, or when it is marked
 * "always on". Everything sent is capped so a big lorebook can never crowd out the character or the story.
 * Nothing here talks to the database or the network.
 */

/** Characters of lorebook text sent with one reply, in total, unless the lorebook asks for another number. */
export const LOREBOOK_BUDGET_CHARACTERS = 8_000;
/** The least and the most a lorebook can ask for. The most keeps the character, the memory and the chat inside the model's reach. */
export const LOREBOOK_BUDGET_MIN_CHARACTERS = 1_000;
export const LOREBOOK_BUDGET_MAX_CHARACTERS = 40_000;
/** One entry is cut at this length when it is sent (the full text stays saved), or at the reply size if that is smaller. */
export const LOREBOOK_ENTRY_MAX_CHARACTERS = 20_000;
/** How many of the latest messages are searched for keywords when neither the entry nor its lorebook says. */
export const LOREBOOK_SCAN_MESSAGES = 3;
/** The most messages an entry or a lorebook can ask to search. */
export const LOREBOOK_MAX_SCAN_MESSAGES = 10;
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
  /** The lorebook this entry belongs to, to find its default depth. */
  lorebook_id?: string | null;
  /** This entry's own depth, or null to use its lorebook's. */
  scan_depth?: number | null;
}

/** A depth the member can ask for, or null when it is missing or not a whole number from 1 to 10. */
export function validDepth(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= LOREBOOK_MAX_SCAN_MESSAGES ? value : null;
}

/** A reply size the member can ask for, or null when it is missing or outside the allowed range. */
export function validBudget(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= LOREBOOK_BUDGET_MIN_CHARACTERS && value <= LOREBOOK_BUDGET_MAX_CHARACTERS ? value : null;
}

/**
 * The text of an entry that would really be sent. It is never longer than the entry limit, nor than what the reply size leaves
 * after the title, and when it is cut the "…" that marks the cut is counted inside that length.
 */
function sentText(entry: LorebookEntry, budget: number): string {
  const room = Math.max(0, Math.min(LOREBOOK_ENTRY_MAX_CHARACTERS, budget - (entry.title ?? '').trim().length));
  const content = (entry.content ?? '').trim();
  if (content.length <= room) return content;
  return room > 0 ? `${content.slice(0, room - 1)}…` : '';
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
  options: {
    budget?: number;
    /** Messages searched by an entry that does not say, and whose lorebook is not in `bookDepths`. */
    scan?: number;
    /** Each lorebook's own depth, by lorebook id. */
    bookDepths?: ReadonlyMap<string, number>;
  } = {},
): LorebookEntry[] {
  const budget = options.budget ?? LOREBOOK_BUDGET_CHARACTERS;
  const fallback = validDepth(options.scan) ?? LOREBOOK_SCAN_MESSAGES;
  // The text of the latest `n` messages, built once per depth.
  const texts = new Map<number, string>();
  const textFor = (n: number) => {
    let text = texts.get(n);
    if (text === undefined) {
      text = recentMessages.slice(-n).join('\n');
      texts.set(n, text);
    }
    return text;
  };
  const depthOf = (entry: LorebookEntry) =>
    validDepth(entry.scan_depth) ?? (entry.lorebook_id ? validDepth(options.bookDepths?.get(entry.lorebook_id)) : null) ?? fallback;

  const candidates = entries
    .filter((entry) => entry.enabled !== false && (entry.content ?? '').trim().length > 0)
    .filter((entry) => entry.is_constant === true || entryMatches(entry, textFor(depthOf(entry))))
    .sort((a, b) =>
      (b.priority ?? 0) - (a.priority ?? 0)
      || (a.insertion_order ?? 0) - (b.insertion_order ?? 0)
      || (a.title ?? '').localeCompare(b.title ?? ''));

  const picked: LorebookEntry[] = [];
  let used = 0;
  for (const entry of candidates) {
    const text = sentText(entry, budget);
    if (!text) continue;
    const size = text.length + (entry.title ?? '').trim().length;
    if (used + size > budget) continue;
    picked.push(entry);
    used += size;
  }
  return picked;
}

/** The block added to the character's prompt, or null when nothing applies. `budget` is the reply size used to choose the entries. */
export function lorebookBlock(entries: LorebookEntry[], budget: number = LOREBOOK_BUDGET_CHARACTERS): string | null {
  if (entries.length === 0) return null;
  const size = budget;
  const lines = entries.map((entry) => {
    const text = sentText(entry, size);
    const title = (entry.title ?? '').trim();
    return title ? `### ${title}\n${text}` : text;
  });
  return [
    '## Lorebook',
    'Background about this world and its people, relevant to what was just said. Treat it as true. Use it naturally, do not recite it, and never mention this block:',
    ...lines,
  ].join('\n\n');
}
