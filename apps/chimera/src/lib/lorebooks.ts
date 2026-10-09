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
export const ENTRY_SENT_CHARACTERS = 2_500;
/** What the chat sends of a whole lorebook with one reply. */
export const LOREBOOK_SENT_CHARACTERS = 8_000;

export interface LorebookSummary {
  id: string;
  title: string;
  description: string;
  visibility: string;
  entry_count: number;
  updated_at: string;
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
  };
}

/** How many characters of this entry the chat would actually send. */
export function sentLength(form: EntryForm): number {
  return Math.min(form.content.trim().length, ENTRY_SENT_CHARACTERS);
}

export async function loadMyLorebooks(userId: string): Promise<LorebookSummary[]> {
  const { data, error } = await supabase
    .from('lorebooks')
    .select('id, title, description, visibility, entry_count, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LorebookSummary[];
}

/** Lorebooks start private: only their creator sees them. */
export async function createLorebook(userId: string, title: string): Promise<string> {
  const { data, error } = await supabase
    .from('lorebooks')
    .insert({ user_id: userId, title: title.trim().slice(0, LOREBOOK_LIMITS.title) || 'Untitled lorebook', description: '', visibility: 'private' })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('not created');
  return (data as { id: string }).id;
}
