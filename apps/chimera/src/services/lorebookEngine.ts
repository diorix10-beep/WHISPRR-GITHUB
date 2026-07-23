import type { Message, LorebookEntry, LorebookTriggerResult } from '../types';

/**
 * Scans conversation history and matches Lorebook entries based on primary keywords,
 * selective keys, constant flags, and scan depth (Janitor AI & SillyTavern matching logic).
 */
export function scanAndMatchLorebookEntries(
  messages: Message[],
  entries: LorebookEntry[],
  options: { defaultScanDepth?: number } = {}
): LorebookTriggerResult {
  const depth = options.defaultScanDepth ?? 10;
  const recentMsgs = messages.slice(-depth);
  
  // Combine content from recent messages to scan
  const textToScan = recentMsgs.map((m) => m.content).join('\n ');

  const triggeredEntries: LorebookEntry[] = [];
  const matchedKeywordsMap: Record<string, string[]> = {};

  for (const entry of entries) {
    if (!entry.enabled) continue;

    // Manual override check
    if (entry.force_active === false) {
      continue;
    }
    if (entry.force_active === true) {
      triggeredEntries.push(entry);
      matchedKeywordsMap[entry.id] = ['[Forced Active]'];
      continue;
    }

    // Constant insertion check
    if (entry.is_constant) {
      triggeredEntries.push(entry);
      matchedKeywordsMap[entry.id] = ['[Constant]'];
      continue;
    }

    // Primary Keyword Matching
    const keywords = entry.keywords || [];
    if (keywords.length === 0) continue;

    const matchedPrimary: string[] = [];

    for (const kw of keywords) {
      if (!kw || kw.trim() === '') continue;
      const cleanKw = kw.trim();
      const isCaseSensitive = entry.case_sensitive ?? false;

      let isMatch = false;
      if (isCaseSensitive) {
        isMatch = textToScan.includes(cleanKw);
      } else {
        const regex = new RegExp(`\\b${escapeRegExp(cleanKw)}\\b`, 'i');
        isMatch = regex.test(textToScan);
      }

      if (isMatch) {
        matchedPrimary.push(cleanKw);
      }
    }

    if (matchedPrimary.length > 0) {
      // Check selective / secondary keys if defined
      const selectiveKeys = entry.selective_keys || [];
      if (selectiveKeys.length > 0) {
        const hasSelectiveMatch = selectiveKeys.some((sKey) => {
          if (!sKey || sKey.trim() === '') return false;
          const cleanSKey = sKey.trim();
          const regex = new RegExp(`\\b${escapeRegExp(cleanSKey)}\\b`, 'i');
          return regex.test(textToScan);
        });

        if (!hasSelectiveMatch) {
          continue; // Selective key filter failed
        }
      }

      triggeredEntries.push(entry);
      matchedKeywordsMap[entry.id] = matchedPrimary;
    }
  }

  // Sort triggered entries by insertion_order / priority
  triggeredEntries.sort((a, b) => (a.insertion_order ?? 0) - (b.insertion_order ?? 0));

  const compiledPromptText = compileLorebookPromptContext(triggeredEntries);

  return {
    triggeredEntries,
    compiledPromptText,
    matchedKeywordsMap,
  };
}

/**
 * Formats triggered Lorebook entries into structured markdown for AI system prompt context.
 */
export function compileLorebookPromptContext(entries: LorebookEntry[]): string {
  if (entries.length === 0) return '';

  const formatted = entries
    .map((e) => `[${e.title}]:\n${e.content.trim()}`)
    .join('\n\n');

  return `=== WORLD LOREBOOK & CONTEXT ===\n${formatted}\n================================`;
}

/**
 * Parses Janitor AI, Character.AI, or SillyTavern JSON export format into Lorebook structure.
 */
export function parseJanitorLorebookJson(jsonString: string): {
  title: string;
  description: string;
  entries: Partial<LorebookEntry>[];
} {
  try {
    const raw = JSON.parse(jsonString);

    const title = raw.name || raw.title || raw.lorebook?.name || 'Imported Lorebook';
    const description = raw.description || raw.lorebook?.description || 'Imported from JSON';

    const rawEntries = raw.entries || raw.data || raw.lorebook?.entries || (Array.isArray(raw) ? raw : []);

    const entries: Partial<LorebookEntry>[] = rawEntries.map((e: any, index: number) => {
      const keys = Array.isArray(e.keys)
        ? e.keys
        : typeof e.keys === 'string'
        ? e.keys.split(',').map((k: string) => k.trim())
        : Array.isArray(e.keywords)
        ? e.keywords
        : [];

      const selectiveKeys = Array.isArray(e.secondary_keys)
        ? e.secondary_keys
        : typeof e.secondary_keys === 'string'
        ? e.secondary_keys.split(',').map((k: string) => k.trim())
        : [];

      return {
        title: e.comment || e.title || e.name || `Entry ${index + 1}`,
        content: e.content || e.text || '',
        keywords: keys,
        selective_keys: selectiveKeys,
        is_constant: Boolean(e.constant || e.is_constant),
        enabled: e.enabled !== false && e.disable !== true,
        priority: e.priority || 10,
        insertion_order: e.order || index,
      };
    });

    return { title, description, entries };
  } catch (err) {
    throw new Error('Invalid Lorebook JSON format. Please upload a valid Janitor AI or SillyTavern JSON export.');
  }
}

/**
 * Detects if a message contains Out of Character (OOC) instructions.
 */
export function parseOocMessage(text: string): {
  isOoc: boolean;
  oocContent: string;
  isCreateLoreRequest: boolean;
  loreTopic?: string;
} {
  const oocRegex = /(?:\(|\[)?OOC[:\s](.*?)(?:\)|\]|$)/i;
  const match = text.match(oocRegex);

  if (!match) {
    return { isOoc: false, oocContent: '', isCreateLoreRequest: false };
  }

  const oocContent = match[1].trim();

  // Check if requesting lorebook creation
  const createLoreRegex = /(?:add|create|save|record|make)\s+(?:a\s+)?(?:lore|lorebook|world)\s+(?:entry|info)?\s+(?:for|about)?\s*["']?([^"'\n.]+)["']?/i;
  const loreMatch = oocContent.match(createLoreRegex);

  return {
    isOoc: true,
    oocContent,
    isCreateLoreRequest: Boolean(loreMatch),
    loreTopic: loreMatch ? loreMatch[1].trim() : undefined,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
