/**
 * Turns one long text (a character codex, a world bible) into draft lorebook entries.
 *
 * The text is cut at its headings, long parts are cut again at paragraph ends so that no entry is longer than what the
 * chat sends of one entry, and each entry gets a name and keywords taken from its heading. This is a starting point: the
 * writer reviews every entry before anything is saved. Nothing here talks to the database.
 */

/** Longest entry the splitter makes. The chat sends at most 2,500 characters of an entry, so this stays under it. */
export const SPLIT_CHUNK_CHARACTERS = 2_400;
/** Entries marked "always send" beyond this many characters in total do not all fit in one reply (see api/_lib/lorebook.ts). */
export const ALWAYS_SEND_BUDGET = 8_000;

export type HeadingStyle = 'markdown' | 'labelled' | 'caps' | 'numbered' | 'none';

export interface DetectedStyle {
  style: HeadingStyle;
  label: string;
  count: number;
  example: string;
}

export interface Section {
  title: string;
  body: string;
}

export interface DraftEntry {
  title: string;
  /** Comma separated, ready for the entry form. */
  keywords: string;
  content: string;
  isConstant: boolean;
}

const LABELLED = /^(?:volume|vol\.?|episode|chapter|part|section|book|act|arc|universe|season|appendix|annex|tome|partie|chapitre|épisode|livre|acte|saison)\b/i;

function titleOf(style: HeadingStyle, line: string): string {
  const text = line.trim();
  if (style === 'markdown') return text.replace(/^#{1,6}\s+/, '').replace(/\s*#+\s*$/, '').trim();
  return text.replace(/^\*\*(.+)\*\*$/, '$1').replace(/[:：]\s*$/, '').trim();
}

/** Is this line a heading of the given style? */
export function isHeading(style: HeadingStyle, rawLine: string): boolean {
  const line = rawLine.trim();
  if (!line || line.length > 160) return false;
  switch (style) {
    case 'markdown':
      return /^#{1,6}\s+\S/.test(line);
    case 'labelled':
      return LABELLED.test(line) && line.length <= 160 && !/[.!?]$/.test(line);
    case 'caps': {
      const letters = line.replace(/[^\p{L}]/gu, '');
      if (letters.length < 3 || line.length > 100) return false;
      const upper = letters.replace(/[^\p{Lu}]/gu, '').length;
      return upper / letters.length >= 0.85 && !/[.!?]$/.test(line);
    }
    case 'numbered':
      return /^(?:\d{1,3}(?:\.\d{1,3})*[.)]?)\s+\S/.test(line) && line.length <= 100 && !/[.!?]$/.test(line);
    default:
      return false;
  }
}

const STYLE_LABEL: Record<Exclude<HeadingStyle, 'none'>, string> = {
  markdown: 'Lines starting with #',
  labelled: 'Lines starting with Episode, Chapter, Part, Volume…',
  caps: 'Lines written in CAPITALS',
  numbered: 'Numbered lines (1. 2. 3.)',
};

/** The heading styles found in the text (at least two headings each), most useful first. */
export function detectStyles(text: string): DetectedStyle[] {
  const lines = text.split(/\r?\n/);
  const found: DetectedStyle[] = [];
  for (const style of ['markdown', 'labelled', 'caps', 'numbered'] as const) {
    const hits = lines.filter((line) => isHeading(style, line));
    if (hits.length >= 2) found.push({ style, label: STYLE_LABEL[style], count: hits.length, example: titleOf(style, hits[0]).slice(0, 80) });
  }
  return found;
}

/** Cuts the text at the headings of one style. Text before the first heading becomes an "Introduction" section. */
export function splitByStyle(text: string, style: HeadingStyle): Section[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const sections: Section[] = [];
  let current: Section = { title: 'Introduction', body: '' };
  for (const line of lines) {
    if (style !== 'none' && isHeading(style, line)) {
      sections.push(current);
      current = { title: titleOf(style, line), body: '' };
    } else {
      current.body += `${line}\n`;
    }
  }
  sections.push(current);
  return sections.map((section) => ({ title: section.title, body: section.body.trim() })).filter((section) => section.body.length > 0);
}

/** Cuts a long body at paragraph ends, then sentence ends, then spaces, so that no piece is longer than `max`. */
export function chunkBody(body: string, max = SPLIT_CHUNK_CHARACTERS): string[] {
  const text = body.trim();
  if (text.length <= max) return text ? [text] : [];
  const pieces: string[] = [];
  const pushSplit = (paragraph: string) => {
    // A single paragraph longer than the limit: sentence ends first, then the last space before the limit.
    let rest = paragraph;
    while (rest.length > max) {
      const window = rest.slice(0, max);
      let cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '), window.lastIndexOf('\n'));
      if (cut < max * 0.4) cut = window.lastIndexOf(' ');
      if (cut < max * 0.2) cut = max;
      else cut += 1;
      pieces.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) pieces.push(rest);
  };
  const paragraphs = text.split(/\n\s*\n/);
  let buffer = '';
  const flush = () => {
    if (buffer.trim()) pieces.push(buffer.trim());
    buffer = '';
  };
  for (const paragraph of paragraphs) {
    const clean = paragraph.trim();
    if (!clean) continue;
    if (clean.length > max) {
      flush();
      pushSplit(clean);
    } else if (buffer && buffer.length + 2 + clean.length > max) {
      flush();
      buffer = clean;
    } else {
      buffer = buffer ? `${buffer}\n\n${clean}` : clean;
    }
  }
  flush();
  return pieces.filter(Boolean);
}

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'about', 'one', 'two', 'three', 'complete', 'definition',
  'codex', 'roleplay', 'compact', 'paragraph', 'edition', 'optimized', 'copying', 'volume', 'episode', 'chapter', 'part',
  'section', 'universe', 'book', 'introduction', 'notes', 'note', 'les', 'des', 'une', 'pour', 'avec', 'dans', 'partie',
  'chapitre', 'épisode', 'livre', 'acte', 'saison', 'tome',
]);

/** Keywords from a heading: the cleaned heading itself when it is short, plus its meaningful words. Never empty. */
export function suggestKeywords(title: string): string[] {
  const cleaned = title.replace(/[^\p{L}\p{N}\s'’-]/gu, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter((word) => word.length >= 4 && !STOP.has(word.toLowerCase()) && !/^\d+$/.test(word));
  const out = new Map<string, string>();
  const add = (keyword: string) => {
    const key = keyword.toLowerCase();
    if (key && !out.has(key)) out.set(key, keyword);
  };
  if (cleaned && cleaned.length <= 60) add(cleaned);
  for (const word of words) add(word.slice(0, 60));
  if (out.size === 0 && cleaned) add(cleaned.slice(0, 60));
  return Array.from(out.values()).slice(0, 6);
}

/** Keywords from the text itself: its most repeated capitalised words (usually names of people and places). */
export function keywordsFromContent(content: string): string[] {
  const counts = new Map<string, { word: string; n: number }>();
  for (const match of content.matchAll(/(?<![.!?]\s)(?<!^)\b\p{Lu}[\p{L}'’-]{3,}\b/gu)) {
    const word = match[0];
    if (STOP.has(word.toLowerCase())) continue;
    const key = word.toLowerCase();
    const seen = counts.get(key);
    if (seen) seen.n += 1;
    else counts.set(key, { word, n: 1 });
  }
  return Array.from(counts.values()).sort((a, b) => b.n - a.n).slice(0, 4).map((entry) => entry.word);
}

/**
 * The draft entries for a text: one per heading, long ones cut into numbered parts that share the heading's keywords.
 * The first section ("Introduction", the text before the first heading) starts as "always send" when it is short enough.
 */
export function buildDrafts(text: string, style: HeadingStyle, max = SPLIT_CHUNK_CHARACTERS): DraftEntry[] {
  const drafts: DraftEntry[] = [];
  splitByStyle(text, style).forEach((section, sectionIndex) => {
    const parts = chunkBody(section.body, max);
    // Without a real heading there is no title to take keywords from, so they come from the text itself.
    const generic = section.title === 'Introduction';
    const fromTitle = generic ? [] : suggestKeywords(section.title);
    parts.forEach((content, partIndex) => {
      const keywords = (fromTitle.length > 0 ? fromTitle : keywordsFromContent(content)).join(', ');
      drafts.push({
        title: style === 'none' ? `Part ${drafts.length + 1}` : parts.length > 1 ? `${section.title} (${partIndex + 1})` : section.title,
        keywords,
        content,
        isConstant: sectionIndex === 0 && section.title === 'Introduction' && parts.length === 1 && content.length <= max,
      });
    });
  });
  return drafts;
}

/** The style to try first: the first one found, or none (cut by size only). */
export function defaultStyle(styles: DetectedStyle[]): HeadingStyle {
  return styles[0]?.style ?? 'none';
}
