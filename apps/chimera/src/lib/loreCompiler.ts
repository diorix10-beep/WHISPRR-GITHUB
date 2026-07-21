export interface LorebookEntry {
  id?: string;
  title: string;
  keywords?: string[];
  keys?: string;
  content: string;
  enabled?: boolean;
}

export interface LoreMatch {
  title: string;
  matchedKeyword: string;
  content: string;
}

export function findMatchingLoreEntries(
  entries: LorebookEntry[],
  text: string
): LoreMatch[] {
  if (!text || !entries || entries.length === 0) return [];

  const lowerText = text.toLowerCase();
  const matched: LoreMatch[] = [];
  const seenTitles = new Set<string>();

  for (const entry of entries) {
    if (entry.enabled === false) continue;
    if (seenTitles.has(entry.title)) continue;

    // Collect keywords from `keywords` array or comma-separated `keys`
    const keyList: string[] = [];
    if (entry.keywords && Array.isArray(entry.keywords)) {
      keyList.push(...entry.keywords);
    }
    if (entry.keys) {
      keyList.push(...entry.keys.split(',').map((k) => k.trim()));
    }
    if (entry.title) {
      keyList.push(entry.title.trim());
    }

    for (const key of keyList) {
      if (!key || key.length < 2) continue;
      const lowerKey = key.toLowerCase();

      // Check if keyword exists in message text
      if (lowerText.includes(lowerKey)) {
        matched.push({
          title: entry.title,
          matchedKeyword: key,
          content: entry.content,
        });
        seenTitles.add(entry.title);
        break;
      }
    }
  }

  return matched;
}

export function compileLoreSystemPrompt(matches: LoreMatch[]): string {
  if (!matches || matches.length === 0) return '';

  const formatted = matches
    .map((m) => `• [${m.title}] (Matched: "${m.matchedKeyword}"):\n${m.content}`)
    .join('\n\n');

  return `[ACTIVE LOREBOOK RELEVANT CONTEXT]\n${formatted}`;
}
