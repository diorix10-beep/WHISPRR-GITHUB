import { supabase } from './supabase';

export const CATEGORIES = ['General', 'Adventure', 'Fantasy', 'Mystery', 'Sci-Fi', 'Slice of life', 'Companion', 'Comedy', 'Drama'] as const;

export type Visibility = 'private' | 'unlisted' | 'public';

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: 'Private',
  unlisted: 'Unlisted',
  public: 'Public',
};

export const LIMITS = {
  name: 60,
  tagline: 160,
  greeting: 2000,
  scenario: 2000,
  personality: 4000,
  about: 2000,
  examples: 4000,
  tag: 24,
  tags: 6,
} as const;

export interface CharacterForm {
  name: string;
  tagline: string;
  greeting: string;
  scenario: string;
  personality: string;
  about: string;
  examples: string;
  category: string;
  tags: string;
  visibility: Visibility;
}

export const EMPTY_FORM: CharacterForm = {
  name: '',
  tagline: '',
  greeting: '',
  scenario: '',
  personality: '',
  about: '',
  examples: '',
  category: 'General',
  tags: '',
  visibility: 'private',
};

export function parseTags(raw: string): string[] {
  const seen = new Map<string, string>();
  for (const part of raw.split(',')) {
    const tag = part.trim().replace(/\s+/g, ' ').slice(0, LIMITS.tag);
    // "Cozy" and "cozy" are the same tag; the first spelling wins.
    if (tag && !seen.has(tag.toLowerCase())) seen.set(tag.toLowerCase(), tag);
  }
  return Array.from(seen.values()).slice(0, LIMITS.tags);
}

/** Returns a readable problem, or null when the form can be saved. */
export function validateForm(form: CharacterForm): string | null {
  if (!form.name.trim()) return 'Give your character a name.';
  if (!form.greeting.trim()) return 'Write the first message your character says to open a scene.';
  if (!form.personality.trim()) return 'Describe their personality so they stay in character.';
  const checks: Array<[string, string, number]> = [
    ['Name', form.name, LIMITS.name],
    ['Tagline', form.tagline, LIMITS.tagline],
    ['Opening message', form.greeting, LIMITS.greeting],
    ['Scenario', form.scenario, LIMITS.scenario],
    ['Personality', form.personality, LIMITS.personality],
    ['About', form.about, LIMITS.about],
    ['Example dialogue', form.examples, LIMITS.examples],
  ];
  for (const [label, value, max] of checks) {
    if (value.length > max) return `${label} is too long (${value.length} of ${max} characters).`;
  }
  return null;
}

/** Row as stored. Fields the form does not show are carried through unchanged on edit. */
export type CharacterRecord = Record<string, unknown> & { id: string };

function text(row: CharacterRecord | null, key: string, fallback = ''): string {
  const value = row?.[key];
  return typeof value === 'string' ? value : fallback;
}

/**
 * Arguments for save_ai_character_soul. That function rewrites every field it is given, so on
 * edit the fields this form does not show are sent back exactly as they were stored.
 */
export function buildSaveArgs(form: CharacterForm, existing: CharacterRecord | null) {
  const name = form.name.trim();
  return {
    p_character_id: existing?.id ?? null,
    p_name: name,
    p_chat_name: name,
    p_greeting: form.greeting.trim(),
    p_short_description: form.tagline.trim(),
    p_long_description: form.about.trim(),
    p_personality: form.personality.trim(),
    p_scenario: form.scenario.trim(),
    p_example_dialogues: form.examples.trim(),
    p_conversation_style: text(existing, 'conversation_style'),
    p_knowledge: text(existing, 'knowledge'),
    p_tags: parseTags(form.tags),
    p_category: form.category,
    p_visibility: form.visibility,
    p_avatar_url: text(existing, 'avatar_url'),
    p_banner_url: text(existing, 'banner_url'),
    // New characters are SFW only until age verification exists. Existing ratings are kept.
    p_content_rating: text(existing, 'content_rating', 'SFW') || 'SFW',
    p_creator_notes: text(existing, 'creator_notes'),
    p_example_conversations: text(existing, 'example_conversations'),
    p_rp_definition: text(existing, 'rp_definition'),
    p_system_definition: text(existing, 'system_definition'),
    p_system_character_definition: text(existing, 'system_character_definition'),
    p_alternate_greetings: Array.isArray(existing?.alternate_greetings) ? existing?.alternate_greetings : [],
    p_banned_words: text(existing, 'banned_words'),
    p_suggested_persona_name: text(existing, 'suggested_persona_name'),
    p_voice_id: text(existing, 'voice_id'),
    p_architecture_data: existing?.architecture_data && typeof existing.architecture_data === 'object' ? existing.architecture_data : {},
    p_status: 'published',
  };
}

export async function saveCharacter(form: CharacterForm, existing: CharacterRecord | null): Promise<string> {
  const { data, error } = await supabase.rpc('save_ai_character_soul', buildSaveArgs(form, existing));
  if (error || typeof data !== 'string') throw error ?? new Error('The character could not be saved.');
  return data;
}

export function formFromRecord(row: CharacterRecord): CharacterForm {
  const visibility = text(row, 'visibility', 'private');
  return {
    name: text(row, 'chat_name') || text(row, 'name'),
    tagline: text(row, 'short_description'),
    greeting: text(row, 'greeting'),
    scenario: text(row, 'scenario'),
    personality: text(row, 'personality'),
    about: text(row, 'long_description'),
    examples: text(row, 'example_dialogues'),
    category: text(row, 'category', 'General') || 'General',
    tags: Array.isArray(row.tags) ? (row.tags as string[]).join(', ') : '',
    visibility: (['private', 'unlisted', 'public'] as const).includes(visibility as Visibility) ? (visibility as Visibility) : 'private',
  };
}
