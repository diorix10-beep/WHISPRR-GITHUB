import { suggestKeywords } from './lorebookSplit';

/**
 * Reading and writing lorebooks as JSON, so a lorebook can come from another site (Janitor AI, SillyTavern, a character
 * card's "character_book") or be saved as a backup. The reader is deliberately tolerant: sites name the same things
 * differently, so each field is looked for under the names those sites use. Nothing here talks to the database.
 */

export const MAX_JSON_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORTED_ENTRIES = 2_000;

export class LorebookJsonError extends Error {}

export interface ImportedEntry {
  title: string;
  keywords: string[];
  content: string;
  isConstant: boolean;
  caseSensitive: boolean;
  enabled: boolean;
  priority: number;
  scanDepth: number | null;
}

export interface ImportedLorebook {
  name: string;
  description: string;
  scanDepth: number | null;
  /** The reply size in characters, read back from `token_budget` (tokens, about 4 characters each) when it is a size lorebooks here allow. */
  replyBudget: number | null;
  entries: ImportedEntry[];
  /** Plain-words notes about what was left out or guessed. */
  notes: string[];
}

type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The first of these names that the object has (own properties only). */
function pick(obj: Obj, names: string[]): unknown {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(obj, name) && obj[name] !== undefined && obj[name] !== null) return obj[name];
  }
  return undefined;
}

const DEPTH_NAMES = ['scan_depth', 'scanDepth', 'message_depth', 'messageDepth', 'depth'];

const text = (value: unknown): string => (typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '');

function bool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  return null;
}

function keywordList(value: unknown): string[] {
  const parts = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\n;]/) : [];
  const seen = new Map<string, string>();
  for (const part of parts) {
    const keyword = text(part).trim().slice(0, 60);
    if (keyword && !seen.has(keyword.toLowerCase())) seen.set(keyword.toLowerCase(), keyword);
  }
  return Array.from(seen.values()).slice(0, 30);
}

function depthOf(value: unknown): number | null {
  const n = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value;
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
}

/** A card's token budget as a reply size in characters (about 4 per token), or null when it is not a size allowed here. */
function budgetOf(value: unknown): number | null {
  const tokens = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value;
  if (typeof tokens !== 'number' || !Number.isFinite(tokens)) return null;
  const characters = Math.round(tokens * 4);
  return characters >= 1_000 && characters <= 40_000 ? characters : null;
}

function priorityOf(value: unknown): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(-100_000, Math.min(100_000, Math.trunc(n))) : 0;
}

/** Finds the object that holds the entries: the file itself, or a book nested under a card or a world. */
function findBook(value: unknown, depth = 0): Obj | unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isObj(value) || depth > 4) return null;
  if (Array.isArray(value.entries) || isObj(value.entries)) return value;
  for (const key of ['character_book', 'lorebook', 'world_info', 'worldInfo', 'book', 'data']) {
    const inner = value[key];
    if (inner !== undefined) {
      const found = findBook(inner, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function entryList(book: Obj | unknown[]): unknown[] {
  if (Array.isArray(book)) return book;
  const entries = book.entries;
  if (Array.isArray(entries)) return entries;
  // SillyTavern keeps entries in an object keyed by number.
  if (isObj(entries)) return Object.keys(entries).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)).map((key) => entries[key]);
  return [];
}

/** Reads a lorebook from JSON text. Throws LorebookJsonError with a readable message when there is nothing usable. */
export function parseLorebookJson(raw: string): ImportedLorebook {
  let data: unknown;
  try {
    data = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  } catch {
    throw new LorebookJsonError('This file is not valid JSON. Export the lorebook again and try that file.');
  }
  const book = findBook(data);
  if (!book) throw new LorebookJsonError('This does not look like a lorebook: it has no list of entries.');

  const notes: string[] = [];
  const header: Obj = Array.isArray(book) ? {} : book;
  const list = entryList(book);
  if (list.length === 0) throw new LorebookJsonError('This lorebook has no entries.');

  const entries: ImportedEntry[] = [];
  let empty = 0;
  let nameless = 0;
  let guessed = 0;
  let notObjects = 0;
  let selective = 0;
  for (const raw of list.slice(0, MAX_IMPORTED_ENTRIES)) {
    if (!isObj(raw)) {
      notObjects += 1;
      continue;
    }
    const content = text(pick(raw, ['content', 'text', 'entry', 'value', 'description'])).trim();
    if (!content) {
      empty += 1;
      continue;
    }
    const isConstant = bool(pick(raw, ['constant', 'is_constant', 'isConstant', 'always_active', 'alwaysActive', 'always_on', 'alwaysOn'])) ?? false;
    let title = text(pick(raw, ['name', 'comment', 'title', 'label'])).trim().slice(0, 100);
    let keywords = keywordList(pick(raw, ['keys', 'key', 'keywords', 'keyword', 'triggers', 'primary_keys']));
    if (keywords.length === 0 && !isConstant) {
      keywords = title ? suggestKeywords(title) : [];
      if (keywords.length === 0) {
        nameless += 1;
        continue;
      }
      guessed += 1;
    }
    if (!title) title = keywords[0] ?? 'Entry';
    const disable = bool(pick(raw, ['disable', 'disabled']));
    let enabled = bool(pick(raw, ['enabled', 'active', 'is_active', 'isActive'])) ?? (disable === null ? true : !disable);
    // "Selective" entries need a second keyword too. Lorebooks here match on the main keywords alone, so such an entry would
    // fire more often than its author meant: it is kept, but switched off until the creator has looked at it.
    if (!isConstant && bool(raw.selective) === true && keywordList(pick(raw, ['secondary_keys', 'keysecondary', 'secondaryKeys'])).length > 0) {
      selective += 1;
      enabled = false;
    }
    entries.push({
      title,
      keywords,
      content,
      isConstant,
      caseSensitive: bool(pick(raw, ['case_sensitive', 'caseSensitive'])) ?? false,
      enabled,
      priority: priorityOf(pick(raw, ['priority', 'order', 'insertion_order', 'insertionOrder'])),
      scanDepth: depthOf(pick(raw, DEPTH_NAMES) ?? (isObj(raw.extensions) ? pick(raw.extensions, DEPTH_NAMES) : undefined)),
    });
  }
  if (list.length > MAX_IMPORTED_ENTRIES) notes.push(`Only the first ${MAX_IMPORTED_ENTRIES.toLocaleString()} entries were read.`);
  if (empty > 0) notes.push(`${empty.toLocaleString()} ${empty === 1 ? 'entry' : 'entries'} without any text ${empty === 1 ? 'was' : 'were'} left out.`);
  if (nameless > 0) notes.push(`${nameless.toLocaleString()} ${nameless === 1 ? 'entry' : 'entries'} with no keyword and no name ${nameless === 1 ? 'was' : 'were'} left out.`);
  if (notObjects > 0) notes.push(`${notObjects.toLocaleString()} ${notObjects === 1 ? 'item' : 'items'} that ${notObjects === 1 ? 'is' : 'are'} not entries ${notObjects === 1 ? 'was' : 'were'} left out.`);
  if (guessed > 0) notes.push(`${guessed.toLocaleString()} ${guessed === 1 ? 'entry had' : 'entries had'} no keyword: its name was used. Check ${guessed === 1 ? 'it' : 'them'}.`);
  if (selective > 0) notes.push(`${selective.toLocaleString()} ${selective === 1 ? 'entry needs' : 'entries need'} a second keyword in the original, which lorebooks here do not support. ${selective === 1 ? 'It was' : 'They were'} added switched off: check ${selective === 1 ? 'its' : 'their'} keywords, then turn ${selective === 1 ? 'it' : 'them'} on.`);
  if (entries.length === 0) throw new LorebookJsonError('None of the entries could be used: they have no text, or no keyword and no name.');

  return {
    name: text(pick(header, ['name', 'title'])).trim().slice(0, 100),
    description: text(pick(header, ['description', 'summary'])).trim().slice(0, 1000),
    scanDepth: depthOf(pick(header, ['scan_depth', 'scanDepth', 'message_depth', 'messageDepth'])),
    replyBudget: budgetOf(pick(header, ['token_budget', 'tokenBudget'])),
    entries,
    notes,
  };
}

export interface ExportableEntry {
  title: string;
  keywords: string[];
  content: string;
  isConstant: boolean;
  caseSensitive: boolean;
  enabled: boolean;
  priority: number;
  scanDepth: number | null;
}

/**
 * The lorebook as a character card "character_book" object, which other sites read and which this page reads back.
 * Entries keep the order they were given.
 */
export function lorebookToJson(book: { name: string; description: string; scanDepth: number; replyBudget?: number }, entries: ExportableEntry[]) {
  return {
    name: book.name,
    description: book.description,
    scan_depth: book.scanDepth,
    // The card format counts tokens; about 4 characters make 1 token.
    token_budget: Math.round((book.replyBudget ?? 8000) / 4),
    recursive_scanning: false,
    extensions: {},
    entries: entries.map((entry, index) => ({
      id: index,
      keys: entry.keywords,
      secondary_keys: [],
      comment: entry.title,
      name: entry.title,
      content: entry.content,
      constant: entry.isConstant,
      selective: false,
      insertion_order: index,
      enabled: entry.enabled,
      position: 'before_char',
      case_sensitive: entry.caseSensitive,
      priority: entry.priority,
      extensions: entry.scanDepth ? { scan_depth: entry.scanDepth } : {},
    })),
  };
}
