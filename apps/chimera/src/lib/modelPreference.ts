import { supabase } from './supabase';
import { DEFAULT_MODEL_ID, findModel, isUsable } from './chatModels';

/** The member's Model House choice. Anything missing, unknown or not usable counts as the default. */
export async function loadModelChoice(userId: string): Promise<string> {
  const { data, error } = await supabase.from('chimera_user_preferences').select('default_ai_model').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const model = findModel((data as { default_ai_model?: string | null } | null)?.default_ai_model);
  // An old saved id (an alias) answers with the model's current id.
  return isUsable(model) ? model.id : DEFAULT_MODEL_ID;
}

/** Only writes the model: the member's other preferences (adult content, theme…) are left as they are. */
export async function saveModelChoice(userId: string, modelId: string): Promise<void> {
  const { error } = await supabase
    .from('chimera_user_preferences')
    .upsert({ user_id: userId, default_ai_model: modelId }, { onConflict: 'user_id' });
  if (error) throw error;
}
