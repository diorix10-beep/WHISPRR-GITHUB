import { supabase } from './supabase';
import { loadCardNames } from './characterNames';

/** What the panel shows about the character of a scene: the same public details as the character's own page. */
export interface CharacterInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: string | null;
  visibility: string | null;
  shortDescription: string;
  longDescription: string;
  /** The creator's display name, or null when it cannot be shown. */
  creatorName: string | null;
  /** The player made this character. */
  mine: boolean;
}

interface Row {
  id: string;
  user_id: string;
  creator_id: string | null;
  visibility: string | null;
  name: string | null;
  short_description: string | null;
  long_description: string | null;
  content_rating: string | null;
  avatar_url: string | null;
}

/**
 * Null when the character cannot be read any more (for example the creator made it private after the scene began): the
 * database decides, and the panel then says so instead of showing anything. Private notes and the character's
 * instructions are never read here.
 */
export async function loadCharacterInfo(characterId: string, viewerId: string): Promise<CharacterInfo | null> {
  const { data, error } = await supabase
    .from('ai_characters')
    .select('id, user_id, creator_id, visibility, name:chat_name, short_description, long_description, content_rating, avatar_url')
    .eq('id', characterId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Row;
  const names = await loadCardNames([row.user_id, row.creator_id]);
  return {
    id: row.id,
    name: names.get(row.user_id) ?? row.name ?? 'Character',
    avatarUrl: row.avatar_url,
    rating: row.content_rating,
    visibility: row.visibility,
    shortDescription: row.short_description?.trim() ?? '',
    longDescription: row.long_description?.trim() ?? '',
    creatorName: row.creator_id ? names.get(row.creator_id) ?? null : null,
    mine: row.creator_id === viewerId,
  };
}
