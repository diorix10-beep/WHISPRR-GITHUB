import { supabase } from './supabase';

export type ResponseLength = 'short' | 'medium' | 'long';

export const SCENE_LIMITS = {
  title: 80,
  bannedWords: 500,
  pins: 8,
} as const;

export const RESPONSE_LENGTHS: Array<{ id: ResponseLength; label: string; hint: string }> = [
  { id: 'short', label: 'Short', hint: 'One or two brief paragraphs' },
  { id: 'medium', label: 'Medium', hint: 'The default: a few paragraphs' },
  { id: 'long', label: 'Long', hint: 'Fuller, more detailed replies' },
];

/** What this player chose for one scene. Only they can read or change it. */
export interface SceneSettings {
  responseLength: ResponseLength;
  bannedWords: string;
  pinnedMessageIds: string[];
}

export const DEFAULT_SCENE_SETTINGS: SceneSettings = { responseLength: 'medium', bannedWords: '', pinnedMessageIds: [] };

interface SettingsRow {
  response_length: string;
  banned_words: string;
  pinned_message_ids: string[] | null;
}

function fromRow(row: SettingsRow): SceneSettings {
  return {
    responseLength: row.response_length === 'short' || row.response_length === 'long' ? row.response_length : 'medium',
    bannedWords: row.banned_words ?? '',
    pinnedMessageIds: Array.isArray(row.pinned_message_ids) ? row.pinned_message_ids : [],
  };
}

/** Settings are optional: when they cannot be read the scene simply uses the defaults. */
export async function loadSceneSettings(conversationId: string, userId: string): Promise<SceneSettings> {
  const { data, error } = await supabase
    .from('chimera_scene_settings')
    .select('response_length, banned_words, pinned_message_ids')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return DEFAULT_SCENE_SETTINGS;
  return fromRow(data as SettingsRow);
}

export async function saveSceneSettings(conversationId: string, userId: string, settings: SceneSettings): Promise<void> {
  const { error } = await supabase.from('chimera_scene_settings').upsert(
    {
      conversation_id: conversationId,
      user_id: userId,
      response_length: settings.responseLength,
      banned_words: settings.bannedWords.trim().slice(0, SCENE_LIMITS.bannedWords),
      pinned_message_ids: settings.pinnedMessageIds.slice(0, SCENE_LIMITS.pins),
    },
    { onConflict: 'conversation_id,user_id' },
  );
  if (error) throw error;
}

/** Adds or removes a pin. Returns the new list, or null when the limit is reached. */
export function togglePin(current: string[], messageId: string): string[] | null {
  if (current.includes(messageId)) return current.filter((id) => id !== messageId);
  return current.length >= SCENE_LIMITS.pins ? null : [...current, messageId];
}

/** An empty title means "use the character's name". */
export async function renameScene(conversationId: string, title: string): Promise<string | null> {
  const next = title.trim().slice(0, SCENE_LIMITS.title) || null;
  const { data, error } = await supabase.from('conversations').update({ name: next }).eq('id', conversationId).select('id');
  if (error || !data || data.length === 0) throw error ?? new Error('Not allowed');
  return next;
}

export async function deleteScene(conversationId: string): Promise<void> {
  const { data, error } = await supabase.from('conversations').delete().eq('id', conversationId).select('id');
  if (error || !data || data.length === 0) throw error ?? new Error('Not allowed');
}

export interface StartOverInput {
  userId: string;
  botUserId: string;
  title: string | null;
  /** The old scene's memory notes, or an empty string to begin with a clean memory. */
  canon: string;
  /** Carries the persona over only when the player had explicitly chosen one (or chosen none). */
  persona: { selected: boolean; id: string | null };
  settings: SceneSettings;
}

/**
 * Begins a fresh scene with the same character. The old scene is kept as it was: nothing is deleted,
 * and the player can remove it separately. Pinned messages are not carried over, they belong to the old story.
 * The new scene exists as soon as it is created, so a failure copying the persona or settings is reported
 * in `warnings` instead of being thrown, and the caller still opens the scene.
 */
export async function startOverScene(input: StartOverInput): Promise<{ id: string; warnings: string[] }> {
  const { data, error } = await supabase.rpc('create_chimera_scene', {
    p_bot_ids: [input.botUserId],
    p_name: input.title,
    p_canon: input.canon,
  });
  const scene = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
  if (error || !scene?.id) throw error ?? new Error('Scene not created');
  const warnings: string[] = [];
  if (input.persona.selected) {
    const { error: personaError } = await supabase.rpc('set_chimera_scene_persona', {
      p_conversation_id: scene.id,
      p_persona_id: input.persona.id,
    });
    if (personaError) warnings.push('persona');
  }
  if (input.settings.responseLength !== 'medium' || input.settings.bannedWords.trim()) {
    try {
      await saveSceneSettings(scene.id, input.userId, { ...input.settings, pinnedMessageIds: [] });
    } catch {
      warnings.push('settings');
    }
  }
  return { id: scene.id, warnings };
}
