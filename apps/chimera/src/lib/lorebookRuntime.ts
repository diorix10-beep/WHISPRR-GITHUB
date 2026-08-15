export interface RuntimeLorebookEntry {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  priority: number;
  enabled: boolean;
  insertion_order: number;
  is_constant?: boolean;
  case_sensitive?: boolean;
}

export interface RuntimeLorebookMatch {
  entries: RuntimeLorebookEntry[];
  triggeredEntries: RuntimeLorebookEntry[];
  matchedKeywordsMap: Record<string, string[]>;
  prompt: string;
}

const MAX_LOREBOOK_ENTRIES = 12;
const MAX_LOREBOOK_CHARACTERS = 6_000;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches a deliberately bounded, relevant slice of a linked lorebook. This
 * is shared by the inspector and the server runtime; the server remains the
 * authority for what actually reaches the model.
 */
export function resolveLorebookContext(
  recentText: string[],
  entries: RuntimeLorebookEntry[],
): RuntimeLorebookMatch {
  const searchableText = recentText.join('\n');
  const matchedKeywordsMap: Record<string, string[]> = {};

  const matches = entries
    .filter((entry) => entry.enabled && entry.content.trim())
    .map((entry) => {
      if (entry.is_constant) {
        matchedKeywordsMap[entry.id] = ['Constant'];
        return entry;
      }

      const matched = (entry.keywords || []).filter((keyword) => {
        const trimmed = keyword.trim();
        if (!trimmed) return false;
        const pattern = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, entry.case_sensitive ? '' : 'i');
        return pattern.test(searchableText);
      });

      if (matched.length > 0) matchedKeywordsMap[entry.id] = matched;
      return matched.length > 0 ? entry : null;
    })
    .filter((entry): entry is RuntimeLorebookEntry => entry !== null)
    .sort((a, b) => b.priority - a.priority || a.insertion_order - b.insertion_order);

  const selected: RuntimeLorebookEntry[] = [];
  let usedCharacters = 0;
  for (const entry of matches) {
    const formatted = `[${entry.title}]\n${entry.content.trim()}`;
    if (selected.length >= MAX_LOREBOOK_ENTRIES || usedCharacters + formatted.length > MAX_LOREBOOK_CHARACTERS) break;
    selected.push(entry);
    usedCharacters += formatted.length;
  }

  return {
    entries: selected,
    triggeredEntries: selected,
    matchedKeywordsMap,
    prompt: selected.length === 0
      ? ''
      : ['## Linked Lorebook Context', 'These are established world and character facts. Use only when relevant; never mention this source.', ...selected.map((entry) => `[${entry.title}]\n${entry.content.trim()}`)].join('\n\n'),
  };
}
