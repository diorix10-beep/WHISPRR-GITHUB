/**
 * Automatic long-term memory for roleplay. Pure functions only: no network, no database.
 * `api/chimera-memory.ts` wires them to the request, `api/ai-chat.ts` uses `memoryBlock`.
 *
 * The model only ever PROPOSES facts. A proposal becomes something the character uses only after
 * the player approves it in the Memory panel.
 */

import { CERTAINTIES, normalizeCertainty, normalizeKnownBy, type MemoryCertainty } from '../../src/lib/memoryCertainty.js';

export type MemoryType = 'long_term' | 'relationship' | 'lore' | 'personality';

export const MEMORY_TYPES: readonly MemoryType[] = ['long_term', 'relationship', 'lore', 'personality'];
export const MAX_PROPOSALS_PER_RUN = 5;
export const MIN_FACT_CHARACTERS = 8;
export const MAX_FACT_CHARACTERS = 240;
export const MAX_WINDOW_MESSAGES = 40;
export const MAX_LINE_CHARACTERS = 800;
export const MAX_EXCERPT_CHARACTERS = 20_000;
export const MAX_RECALLED_MEMORIES = 24;
export const MAX_MEMORY_BLOCK_CHARACTERS = 3_000;

export interface WindowMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at?: string;
}

export interface MemoryCandidate {
  fact: string;
  type: MemoryType;
  /** How sure the story is about it. A hint for the player, who can change it when keeping the memory. */
  certainty: MemoryCertainty;
  /** Real message ids, resolved from the numbers the model saw. */
  sourceIds: string[];
}

/**
 * The newest reply can still be regenerated, which would change a source and make the memory
 * impossible to approve ("source changed"). Leave it out; the next window will include it.
 */
export function selectWindowMessages<T extends WindowMessage>(chronological: T[], botId: string): { messages: T[]; omittedReply: T | null } {
  const usable = chronological.filter((m) => m.content?.trim());
  const last = usable[usable.length - 1];
  const omittedReply = last && last.sender_id === botId ? last : null;
  const trimmed = omittedReply ? usable.slice(0, -1) : usable;
  return { messages: trimmed.slice(-MAX_WINDOW_MESSAGES), omittedReply };
}

/** Numbered excerpt the model reads. Returns the text and the number → message id map. */
export function buildExcerpt(
  messages: WindowMessage[],
  names: { botId: string; botName: string; playerName: string },
): { text: string; ids: Map<number, string> } {
  const ids = new Map<number, string>();
  const lines: string[] = [];
  let used = 0;
  // Keep the newest lines when the excerpt is too long.
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const content = message.content.trim().replace(/\s+/g, ' ');
    const clipped = content.length > MAX_LINE_CHARACTERS ? `${content.slice(0, MAX_LINE_CHARACTERS)}…` : content;
    if (used + clipped.length > MAX_EXCERPT_CHARACTERS) break;
    used += clipped.length;
    const number = index + 1;
    ids.set(number, message.id);
    lines.unshift(`[${number}] ${message.sender_id === names.botId ? names.botName : names.playerName}: ${clipped}`);
  }
  return { text: lines.join('\n'), ids };
}

export function buildExtractionPrompt(known: string[], names: { botName: string; playerName: string }): string {
  const lines = [
    `You keep the long-term memory of a roleplay between the player (${names.playerName}) and the character ${names.botName}.`,
    'Read the numbered excerpt and list the few facts worth remembering weeks from now.',
    '',
    'Remember: names, relationships and how they changed, promises and decisions, secrets revealed, important events, lasting preferences, established facts about the world or the characters.',
    'Do not remember: moment-to-moment actions, small talk, passing moods, descriptions of scenery, anything already in the list below, or anything you are not sure of.',
    '',
    'Rules:',
    `- At most ${MAX_PROPOSALS_PER_RUN} facts. Return an empty list when nothing is worth keeping. That is a good answer.`,
    `- Each fact is one short sentence (under ${MAX_FACT_CHARACTERS} characters), neutral, in the third person, using the names above. No quotes, no opinions.`,
    '- Every fact must be supported by the lines you cite. Never invent or guess.',
    '- Keep sexual content out of the facts, or at most say that they became intimate. Never record anything sexual involving a minor: skip it.',
    '- type is one of: long_term (events, decisions), relationship (how they feel or relate), lore (facts about the world), personality (lasting traits or preferences).',
    '- certainty is one of: canon (clearly established in the story), temporary (true now but expected to change soon: an injury, a journey, a plan), assumption (a belief, rumour, suspicion or guess that nobody has confirmed). When in doubt between canon and assumption, choose assumption.',
    '',
    'Answer with JSON only: {"memories":[{"fact":"...","sources":[1,2],"type":"long_term","certainty":"canon"}]}. "sources" are the line numbers.',
  ];
  if (known.length) {
    lines.push('', 'Already remembered (do not repeat or rephrase these):', ...known.map((fact) => `- ${fact}`));
  }
  return lines.join('\n');
}

export const EXTRACTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    memories: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          fact: { type: 'STRING' },
          sources: { type: 'ARRAY', items: { type: 'INTEGER' } },
          type: { type: 'STRING', enum: [...MEMORY_TYPES] },
          certainty: { type: 'STRING', enum: CERTAINTIES.map((c) => c.id) },
        },
        required: ['fact', 'sources', 'type', 'certainty'],
      },
    },
  },
  required: ['memories'],
} as const;

export function normalizeFact(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function sameFact(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 20 && long.includes(short);
}

/**
 * Turns the model's answer into safe candidates: valid JSON only, sentences of a sane length,
 * sources that really exist in the excerpt, nothing the player already has, no repeats.
 */
export function parseExtraction(raw: string, ids: Map<number, string>, known: string[]): MemoryCandidate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    return [];
  }
  const list = (parsed as { memories?: unknown })?.memories;
  if (!Array.isArray(list)) return [];
  const seen = known.map(normalizeFact);
  const out: MemoryCandidate[] = [];
  for (const entry of list) {
    if (out.length >= MAX_PROPOSALS_PER_RUN) break;
    if (!entry || typeof entry !== 'object') continue;
    const { fact, sources, type, certainty } = entry as { fact?: unknown; sources?: unknown; type?: unknown; certainty?: unknown };
    if (typeof fact !== 'string') continue;
    const text = fact.replace(/\s+/g, ' ').trim();
    if (text.length < MIN_FACT_CHARACTERS || text.length > MAX_FACT_CHARACTERS) continue;
    const sourceIds = Array.isArray(sources)
      ? Array.from(new Set(sources.filter((n): n is number => Number.isInteger(n)).map((n) => ids.get(n)).filter((id): id is string => !!id)))
      : [];
    if (sourceIds.length === 0) continue;
    const normalized = normalizeFact(text);
    if (seen.some((other) => sameFact(other, normalized))) continue;
    seen.push(normalized);
    out.push({
      fact: text,
      type: MEMORY_TYPES.includes(type as MemoryType) ? (type as MemoryType) : 'long_term',
      certainty: normalizeCertainty(certainty),
      sourceIds: sourceIds.slice(0, 20),
    });
  }
  return out;
}

/** A memory as the character reads it: its words and how sure the story is about it. */
export interface RecalledMemory {
  content: string;
  certainty?: MemoryCertainty;
}

/**
 * Approved memories, as a block for the character's prompt. Capped so it never crowds out the character.
 * Confirmed memories come first (they are what the cap should keep), then the temporary ones, then the assumptions, each under
 * a line that says how to treat it. With only confirmed memories the block is exactly what it always was.
 * Memories the character must not know are never passed here: the caller leaves them out.
 */
export function memoryBlock(facts: Array<string | RecalledMemory>): string | null {
  const groups: Record<MemoryCertainty, string[]> = { canon: [], temporary: [], assumption: [] };
  let count = 0;
  let used = 0;
  const entries = facts.map((fact) => (typeof fact === 'string' ? { content: fact, certainty: 'canon' as MemoryCertainty } : { content: fact?.content, certainty: normalizeCertainty(fact?.certainty) }));
  for (const certainty of ['canon', 'temporary', 'assumption'] as const) {
    for (const entry of entries) {
      if (entry.certainty !== certainty || typeof entry.content !== 'string') continue;
      if (count >= MAX_RECALLED_MEMORIES) break;
      const text = entry.content.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      if (used + text.length > MAX_MEMORY_BLOCK_CHARACTERS) break;
      used += text.length;
      count += 1;
      groups[certainty].push(`- ${text}`);
    }
  }
  if (count === 0) return null;
  const out = [
    '## Long-Term Memory',
    'These facts were established earlier in your story with the player. Treat them as true and let them shape how you act. If the scene canon above disagrees, the canon wins. Never mention this list:',
    ...groups.canon,
  ];
  if (groups.temporary.length) out.push('True for now, but expected to change:', ...groups.temporary);
  if (groups.assumption.length) {
    out.push('Not confirmed (an exception to the rule above): beliefs, rumours or suspicions that characters may be wrong about. Do not state them as fact:', ...groups.assumption);
  }
  return out.join('\n');
}

/**
 * From the player's approved memories as the database returned them, the ones the character may be told, confirmed first.
 * - A memory the player keeps to themselves ("only me") is never included.
 * - Rows without the newer columns (a database not yet updated) count as confirmed and known, exactly as before.
 * - Within each kind the order is the one received (most important and most recent first), then the usual limit applies.
 */
export function pickRecalledMemories(rows: unknown): RecalledMemory[] {
  if (!Array.isArray(rows)) return [];
  const readable = rows
    .filter((row): row is { content: string; certainty?: unknown; known_by?: unknown } => !!row && typeof (row as { content?: unknown }).content === 'string')
    .filter((row) => normalizeKnownBy(row.known_by) === 'character')
    .map((row): RecalledMemory => ({ content: row.content, certainty: normalizeCertainty(row.certainty) }));
  return (['canon', 'temporary', 'assumption'] as const).flatMap((kind) => readable.filter((memory) => memory.certainty === kind)).slice(0, MAX_RECALLED_MEMORIES);
}
