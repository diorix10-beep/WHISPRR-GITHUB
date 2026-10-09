import { supabase } from './supabase';

/**
 * The name shown on a character's card is the profile's display name. The character row only keeps the chat name,
 * which can be a nickname. A failed read is not an error here: callers fall back to the chat name they already have.
 */
export async function loadCardNames(userIds: Array<string | null | undefined>): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => typeof id === 'string' && id.length > 0)));
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  try {
    const { data, error } = await supabase.from('profiles').select('user_id, display_name').in('user_id', ids);
    if (error || !data) return names;
    for (const row of data as Array<{ user_id: string; display_name: string | null }>) {
      if (row.display_name?.trim()) names.set(row.user_id, row.display_name.trim());
    }
  } catch {
    // keep the chat names
  }
  return names;
}
