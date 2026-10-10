import { supabase } from './supabase';

export const MEMORY_LIMITS = { content: 300 } as const;
/** The most memories one player keeps for one character and persona: the list the screen reads holds this many. */
export const MAX_MEMORIES = 100;

/** The kinds of memory a player can write by hand (the same ones the story suggests). */
export const MEMORY_TYPES = [
  { id: 'long_term', label: 'Event', hint: 'Something that happened or was decided' },
  { id: 'relationship', label: 'Relationship', hint: 'How they feel about each other' },
  { id: 'lore', label: 'World fact', hint: 'A fact about the world or its people' },
  { id: 'personality', label: 'Trait', hint: 'A lasting trait or preference' },
] as const;
export type MemoryTypeId = (typeof MEMORY_TYPES)[number]['id'];

export function memoryTypeLabel(type: string): string {
  return MEMORY_TYPES.find((t) => t.id === type)?.label ?? 'Note';
}

export interface SceneMemory {
  id: string;
  content: string;
  type: string;
  status: 'proposed' | 'approved';
  /** Null means the memory is kept for every scene with this character. */
  conversationId: string | null;
  updatedAt: string;
}

interface MemoryRow {
  id: string;
  content: string;
  memory_type: string;
  approval_status: string;
  conversation_id: string | null;
  updated_at: string;
}

/** The memories this player has for this character and persona: this scene's, and the ones kept for all scenes. */
export async function loadMemories(conversationId: string, characterId: string, personaId: string | null): Promise<SceneMemory[]> {
  let query = supabase
    .from('character_memories')
    .select('id, content, memory_type, approval_status, conversation_id, updated_at')
    .eq('character_id', characterId)
    .is('session_id', null)
    .or(`conversation_id.eq.${conversationId},conversation_id.is.null`)
    .order('updated_at', { ascending: false })
    .limit(100);
  query = personaId ? query.eq('persona_id', personaId) : query.is('persona_id', null);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as MemoryRow[]).map((row) => ({
    id: row.id,
    content: row.content,
    type: row.memory_type,
    status: row.approval_status === 'proposed' ? 'proposed' : 'approved',
    conversationId: row.conversation_id,
    updatedAt: row.updated_at,
  }));
}

/** Approving checks that the messages the suggestion came from still say the same thing. */
export async function approveMemory(memory: SceneMemory, acrossScenes: boolean): Promise<void> {
  const { error } = await supabase.rpc('approve_chimera_memory', {
    p_memory_id: memory.id,
    p_expected_updated_at: memory.updatedAt,
    p_across_scenes: acrossScenes,
  });
  if (error) throw error;
}

/** Returns the new `updatedAt`, needed to approve the edited text afterwards. */
export async function editMemory(id: string, content: string): Promise<string> {
  const text = content.trim().slice(0, MEMORY_LIMITS.content);
  const { data, error } = await supabase.from('character_memories').update({ content: text }).eq('id', id).select('updated_at');
  if (error || !data || data.length === 0) throw error ?? new Error('Not allowed');
  return (data[0] as { updated_at: string }).updated_at;
}

export async function deleteMemory(id: string): Promise<void> {
  const { data, error } = await supabase.from('character_memories').delete().eq('id', id).select('id');
  if (error || !data || data.length === 0) throw error ?? new Error('Not allowed');
}

/**
 * Asks the server to look at the newest part of the scene and suggest memories. Cheap when there is
 * nothing to do. Returns how many suggestions were added; never throws, because it is a background nicety.
 */
export async function requestMemorySuggestions(conversationId: string, botUserId: string): Promise<number> {
  try {
    const { data } = await supabase.auth.getSession();
    const response = await fetch('/api/chimera-memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      body: JSON.stringify({ conversation_id: conversationId, bot_user_id: botUserId }),
    });
    const payload = await response.json().catch(() => ({}));
    return response.ok && typeof payload?.proposed === 'number' ? payload.proposed : 0;
  } catch {
    return 0;
  }
}

/**
 * Writes a memory by hand. It is the player's own and counts at once (nothing to approve). `conversationId` null keeps it for
 * every scene with this character as this persona; otherwise it belongs to that scene only. The database checks that the
 * scene and the persona are the player's own.
 */
export async function addMemory(input: {
  userId: string;
  characterId: string;
  personaId: string | null;
  conversationId: string | null;
  type: MemoryTypeId;
  content: string;
}): Promise<void> {
  const content = input.content.trim();
  if (content.length === 0 || content.length > MEMORY_LIMITS.content) throw new Error('A memory is 1 to 300 characters.');
  if (!MEMORY_TYPES.some((t) => t.id === input.type)) throw new Error('Choose a kind of memory.');
  const { error } = await supabase.from('character_memories').insert({
    user_id: input.userId,
    character_id: input.characterId,
    persona_id: input.personaId,
    conversation_id: input.conversationId,
    memory_type: input.type,
    content,
    approval_status: 'approved',
    metadata: { origin: 'player' },
  });
  if (error) throw error;
}

/** Moves a kept memory between "this scene only" (the scene's id) and "every scene with this character" (null). Returns the new `updatedAt`. */
export async function setMemoryScope(id: string, conversationId: string | null): Promise<string> {
  const { data, error } = await supabase.from('character_memories').update({ conversation_id: conversationId }).eq('id', id).select('updated_at');
  if (error || !data || data.length === 0) throw error ?? new Error('Not allowed');
  return (data[0] as { updated_at: string }).updated_at;
}

/**
 * How many memories are kept for every scene with this character as this persona, counted in the database (the screen's list is
 * cut at 100 and mixes in the current scene's own memories, so it cannot say).
 */
export async function countEveryChatMemories(characterId: string, personaId: string | null): Promise<number> {
  let query = supabase
    .from('character_memories')
    .select('id', { count: 'exact', head: true })
    .eq('character_id', characterId)
    .is('session_id', null)
    .is('conversation_id', null);
  query = personaId ? query.eq('persona_id', personaId) : query.is('persona_id', null);
  const { count, error } = await query;
  if (error || count === null) throw error ?? new Error('Count unavailable');
  return count;
}
