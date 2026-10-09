import { supabase } from './supabase';

/**
 * Lorebooks: notes about a world that the AI only sees when they matter (see api/_lib/lorebook.ts for how they
 * are chosen at reply time). A lorebook is private to its creator and is linked to the creator's own characters.
 */

export const LOREBOOK_LIMITS = {
  title: 100,
  description: 1000,
  entryTitle: 100,
  keyword: 60,
  keywords: 30,
} as const;

/** What the chat sends of one entry. The full text stays saved, but only this much is sent with a reply. */
export const ENTRY_SENT_CHARACTERS = 20_000;
/** What the chat sends of a whole lorebook with one reply unless the lorebook asks for another size, and the range it can ask for. */
export const DEFAULT_REPLY_BUDGET = 8_000;
export const MIN_REPLY_BUDGET = 1_000;
export const MAX_REPLY_BUDGET = 40_000;

/** A reply size from 1,000 to 40,000 characters, or null when the value is not one. */
export function validBudget(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_REPLY_BUDGET && value <= MAX_REPLY_BUDGET ? value : null;
}

/** The colours a lorebook can have in the member's list. The ids are what the database accepts. */
export const THEMES = [
  { id: 'purple', label: 'Purple', from: '#a78bfa', to: '#6d28d9' },
  { id: 'midnight', label: 'Midnight', from: '#6366f1', to: '#312e81' },
  { id: 'sky', label: 'Sky', from: '#7dd3fc', to: '#0284c7' },
  { id: 'teal', label: 'Teal', from: '#5eead4', to: '#0f766e' },
  { id: 'forest', label: 'Forest', from: '#86efac', to: '#166534' },
  { id: 'mint', label: 'Mint', from: '#6ee7b7', to: '#059669' },
  { id: 'green', label: 'Green', from: '#a3e635', to: '#4d7c0f' },
  { id: 'orange', label: 'Orange', from: '#fdba74', to: '#c2410c' },
  { id: 'sunset', label: 'Sunset', from: '#fbbf24', to: '#e11d48' },
  { id: 'red', label: 'Red', from: '#fca5a5', to: '#b91c1c' },
  { id: 'candy', label: 'Candy', from: '#f9a8d4', to: '#be185d' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'purple';

export function themeOf(id: unknown): (typeof THEMES)[number] {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

/** How many of the latest messages a lorebook checks for keywords unless it says otherwise (1 to 10). */
export const DEFAULT_SCAN_DEPTH = 3;
export const MAX_SCAN_DEPTH = 10;

/** A whole number from 1 to 10, or null when the value is not one. */
export function validDepth(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_SCAN_DEPTH ? value : null;
}

export interface LorebookSummary {
  id: string;
  title: string;
  description: string;
  visibility: string;
  entry_count: number;
  updated_at: string;
  theme: ThemeId;
  /** How many of the latest messages this lorebook checks. */
  scan_depth: number;
  /** The most characters of this lorebook sent with one reply. */
  reply_budget: number;
  /** How many of the member's characters use it. */
  characters: number;
}

export interface LorebookInput {
  title: string;
  description: string;
  theme: ThemeId;
  scanDepth: number;
  replyBudget: number;
}

export interface EntryForm {
  /** Null until the entry is saved for the first time. */
  id: string | null;
  title: string;
  /** Words or names that bring the entry into the story, separated by commas or new lines. */
  keywords: string;
  content: string;
  /** Always sent, whatever is said. */
  isConstant: boolean;
  caseSensitive: boolean;
  enabled: boolean;
  /** Higher goes first when there is not room for everything. */
  priority: number;
  /** This entry checks that many of the latest messages instead of its lorebook's number. Null: use the lorebook's. */
  scanDepth: number | null;
}

export const EMPTY_ENTRY: EntryForm = {
  id: null,
  title: '',
  keywords: '',
  content: '',
  isConstant: false,
  caseSensitive: false,
  enabled: true,
  priority: 0,
  scanDepth: null,
};

/** Splits "a, b\nc" into clean keywords: trimmed, no empty ones, no duplicates (ignoring case), bounded in length and count. */
export function parseKeywords(raw: string): string[] {
  const seen = new Map<string, string>();
  for (const part of raw.split(/[,\n;]/)) {
    const keyword = part.trim().slice(0, LOREBOOK_LIMITS.keyword);
    if (keyword && !seen.has(keyword.toLowerCase())) seen.set(keyword.toLowerCase(), keyword);
  }
  return Array.from(seen.values()).slice(0, LOREBOOK_LIMITS.keywords);
}

/** A readable problem with the entry, or null when it can be saved. */
export function validateEntry(form: EntryForm): string | null {
  if (!form.content.trim()) return 'Write what the AI should know.';
  if (!form.isConstant && parseKeywords(form.keywords).length === 0) {
    return 'Add at least one keyword, or turn on "Always send".';
  }
  if (form.title.length > LOREBOOK_LIMITS.entryTitle) return 'The entry name is too long.';
  if (!Number.isFinite(form.priority)) return 'Priority must be a number.';
  return null;
}

/** The row to save. `order` keeps entries in the order the creator wrote them. */
export function entryRow(form: EntryForm, lorebookId: string, order: number) {
  return {
    lorebook_id: lorebookId,
    title: form.title.trim() || parseKeywords(form.keywords)[0] || 'Entry',
    content: form.content.trim(),
    keywords: parseKeywords(form.keywords),
    is_constant: form.isConstant,
    case_sensitive: form.caseSensitive,
    enabled: form.enabled,
    priority: Math.trunc(form.priority) || 0,
    insertion_order: order,
    scan_depth: validDepth(form.scanDepth),
  };
}

export function entryFromRow(row: Record<string, unknown>): EntryForm {
  return {
    id: typeof row.id === 'string' ? row.id : null,
    title: typeof row.title === 'string' ? row.title : '',
    keywords: Array.isArray(row.keywords) ? (row.keywords as unknown[]).filter((k): k is string => typeof k === 'string').join(', ') : '',
    content: typeof row.content === 'string' ? row.content : '',
    isConstant: row.is_constant === true,
    caseSensitive: row.case_sensitive === true,
    enabled: row.enabled !== false,
    priority: typeof row.priority === 'number' ? row.priority : 0,
    scanDepth: validDepth(row.scan_depth),
  };
}

/** How many characters of this entry the chat would actually send. */
export function sentLength(form: EntryForm): number {
  return Math.min(form.content.trim().length, ENTRY_SENT_CHARACTERS);
}

export async function loadMyLorebooks(userId: string): Promise<LorebookSummary[]> {
  // All columns, so the list still opens for a lorebook that has no colour or depth yet.
  const { data, error } = await supabase
    .from('lorebooks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const counts = new Map<string, number>();
  if (rows.length > 0) {
    const links = await supabase.from('lorebook_characters').select('lorebook_id').in('lorebook_id', rows.map((row) => String(row.id)));
    for (const link of (links.data ?? []) as Array<{ lorebook_id: string }>) counts.set(link.lorebook_id, (counts.get(link.lorebook_id) ?? 0) + 1);
  }
  return rows.map((row) => ({
    id: String(row.id),
    title: typeof row.title === 'string' ? row.title : '',
    description: typeof row.description === 'string' ? row.description : '',
    visibility: typeof row.visibility === 'string' ? row.visibility : 'private',
    entry_count: typeof row.entry_count === 'number' ? row.entry_count : 0,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : '',
    theme: themeOf(row.theme).id,
    scan_depth: validDepth(row.scan_depth) ?? DEFAULT_SCAN_DEPTH,
    reply_budget: validBudget(row.reply_budget) ?? DEFAULT_REPLY_BUDGET,
    characters: counts.get(String(row.id)) ?? 0,
  }));
}

/** The values to save for a lorebook, tidied and bounded. */
export function lorebookRow(input: Partial<LorebookInput>) {
  return {
    title: (input.title ?? '').trim().slice(0, LOREBOOK_LIMITS.title) || 'Untitled lorebook',
    description: (input.description ?? '').trim().slice(0, LOREBOOK_LIMITS.description),
    theme: themeOf(input.theme).id,
    scan_depth: validDepth(input.scanDepth) ?? DEFAULT_SCAN_DEPTH,
    reply_budget: validBudget(input.replyBudget) ?? DEFAULT_REPLY_BUDGET,
  };
}

/** Lorebooks start private: only their creator sees them. */
export async function createLorebook(userId: string, input: string | Partial<LorebookInput>): Promise<string> {
  const row = lorebookRow(typeof input === 'string' ? { title: input } : input);
  const { data, error } = await supabase
    .from('lorebooks')
    .insert({ user_id: userId, ...row, visibility: 'private' })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('not created');
  return (data as { id: string }).id;
}

/** Entries are saved this many at a time. */
const INSERT_BATCH = 100;

/**
 * Saves entries into a lorebook, in order, a batch at a time. `firstOrder` is where numbering starts, so entries added to
 * an existing lorebook go after the ones it already has.
 */
export async function insertEntries(lorebookId: string, entries: EntryForm[], firstOrder = 0): Promise<void> {
  const rows = entries.map((form, index) => entryRow(form, lorebookId, firstOrder + index));
  // The batches are separate requests. If one fails, the ones already saved are taken out again, so a failed import leaves the
  // lorebook as it was and trying again cannot duplicate anything.
  const saved: string[][] = [];
  try {
    for (let from = 0; from < rows.length; from += INSERT_BATCH) {
      const { data, error } = await supabase.from('lorebook_entries').insert(rows.slice(from, from + INSERT_BATCH)).select('id');
      if (error) throw error;
      saved.push(((data ?? []) as Array<{ id: string }>).map((row) => row.id));
    }
  } catch (error) {
    for (const ids of saved) {
      if (ids.length > 0) await supabase.from('lorebook_entries').delete().eq('lorebook_id', lorebookId).in('id', ids);
    }
    throw error;
  }
}

/** Reads a lorebook's entries from the database as editor rows, in the order they were written. */
export async function loadEntryRows(lorebookId: string): Promise<Array<Record<string, unknown>>> {
  const { data, error } = await supabase.from('lorebook_entries').select('*').eq('lorebook_id', lorebookId).order('insertion_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}

/**
 * Creates a private lorebook with all its entries. If anything fails part-way, the lorebook is deleted again (its
 * entries go with it), so a failed creation leaves nothing half-made behind.
 */
export async function createLorebookWithEntries(userId: string, input: string | Partial<LorebookInput>, entries: EntryForm[]): Promise<string> {
  const id = await createLorebook(userId, input);
  try {
    await insertEntries(id, entries);
  } catch (error) {
    await supabase.from('lorebooks').delete().eq('id', id).eq('user_id', userId);
    throw error;
  }
  return id;
}

/** Lets a character of the member use a lorebook of the member. Already linked counts as done. */
export async function linkLorebookToCharacter(lorebookId: string, characterId: string): Promise<void> {
  const { error } = await supabase.from('lorebook_characters').insert({ lorebook_id: lorebookId, character_id: characterId });
  if (error && error.code !== '23505') throw error;
}

/** Entries read from a JSON file, as forms ready to save. */
export function formsFromImport(entries: Array<{ title: string; keywords: string[]; content: string; isConstant: boolean; caseSensitive: boolean; enabled: boolean; priority: number; scanDepth: number | null }>): EntryForm[] {
  return entries.map((entry) => ({
    id: null,
    title: entry.title,
    keywords: entry.keywords.join(', '),
    content: entry.content,
    isConstant: entry.isConstant,
    caseSensitive: entry.caseSensitive,
    enabled: entry.enabled,
    priority: entry.priority,
    scanDepth: entry.scanDepth,
  }));
}
