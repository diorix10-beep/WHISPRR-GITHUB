import { supabase } from './supabase';

export const MEMORY_LIMITS = { content: 300 } as const;

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
