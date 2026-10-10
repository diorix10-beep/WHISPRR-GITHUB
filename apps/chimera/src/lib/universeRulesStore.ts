import { supabase } from './supabase';
import { EMPTY_RULES, normalizeUniverseRules, type UniverseRules } from './universeRules';

/**
 * `ready` is false when the saved rules could not be read (a failed request, or a database that does not have the
 * column yet). The screen then shows the form but must not save: it would replace what the player wrote with an empty form.
 */
export async function loadUniverseRules(conversationId: string, userId: string): Promise<{ rules: UniverseRules; ready: boolean }> {
  const { data, error } = await supabase
    .from('chimera_scene_settings')
    .select('universe_rules')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { rules: EMPTY_RULES, ready: false };
  return { rules: data ? normalizeUniverseRules((data as { universe_rules?: unknown }).universe_rules) : EMPTY_RULES, ready: true };
}

/** Writes only the rules: the other settings of the scene (reply length, word list, pins) are left as they are. */
export async function saveUniverseRules(conversationId: string, userId: string, rules: UniverseRules): Promise<UniverseRules> {
  const clean = normalizeUniverseRules(rules);
  const { error } = await supabase
    .from('chimera_scene_settings')
    .upsert({ conversation_id: conversationId, user_id: userId, universe_rules: clean }, { onConflict: 'conversation_id,user_id' });
  if (error) throw error;
  return clean;
}
