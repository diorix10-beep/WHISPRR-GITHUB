import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_RECALLED_MEMORIES, pickRecalledMemories, type RecalledMemory } from './memory.js';

/**
 * Facts the player approved as long-term memory for this character and persona: the ones tied to this scene and the ones kept
 * for every scene. Optional by design: if they cannot be read the character still answers.
 *
 * The limit is applied where it cannot push a confirmed fact out. Each kind (confirmed, temporary, assumption) is read on its
 * own with its own limit, so a pile of newer rumours cannot displace older facts even when a player has more than a hundred
 * memories; memories the player keeps to themselves ("only me") are left out in the query and again in `pickRecalledMemories`.
 *
 * A database that does not have the newer columns yet makes those queries fail. Then the character gets exactly what it always
 * got: the most important memories, with no filter (before the columns every memory is confirmed and known).
 */
export async function loadRecalledMemories(
  supabase: SupabaseClient,
  input: { userId: string; conversationId: string; characterId: string; personaId: string | null },
): Promise<RecalledMemory[]> {
  const base = () => {
    let query = supabase
      .from('character_memories')
      .select('*')
      .eq('user_id', input.userId)
      .eq('character_id', input.characterId)
      .eq('approval_status', 'approved')
      .is('session_id', null)
      .or(`conversation_id.eq.${input.conversationId},conversation_id.is.null`)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(MAX_RECALLED_MEMORIES);
    query = input.personaId ? query.eq('persona_id', input.personaId) : query.is('persona_id', null);
    return query;
  };
  try {
    const kinds = ['canon', 'temporary', 'assumption'] as const;
    const answers = await Promise.all(kinds.map((kind) => base().eq('certainty', kind).neq('known_by', 'player')));
    if (answers.every((answer) => !answer.error && Array.isArray(answer.data))) {
      return pickRecalledMemories(answers.flatMap((answer) => answer.data as unknown[]));
    }
    // The newer columns are not there (or a read failed): the way it always was.
    const legacy = await base();
    if (legacy.error || !Array.isArray(legacy.data)) return [];
    return pickRecalledMemories(legacy.data);
  } catch {
    return [];
  }
}
