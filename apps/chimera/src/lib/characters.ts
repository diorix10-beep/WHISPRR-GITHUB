import { supabase } from './supabase';

export const CATEGORIES = ['General', 'Adventure', 'Fantasy', 'Mystery', 'Sci-Fi', 'Slice of life', 'Companion', 'Comedy', 'Drama'] as const;

export type Visibility = 'private' | 'unlisted' | 'public';

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: 'Private',
  unlisted: 'Unlisted',
  public: 'Public',
};

/**
 * Ceilings, not targets: nothing here is shown while someone writes. Long text is welcome. The only size that
 * really matters is the whole definition, which the chat has to fit into every single reply (see
 * MAX_DEFINITION_CHARACTERS). Short fields (names, tagline) stay short because they are shown on cards.
 */
export const LIMITS = {
  name: 100,
  chatName: 100,
  tagline: 200,
  greeting: 60_000,
  scenario: 60_000,
  personality: 60_000,
  examples: 60_000,
  style: 60_000,
  lore: 60_000,
  avoid: 5_000,
  notes: 60_000,
  tag: 24,
  tags: 10,
} as const;

/**
 * Everything written for the AI is sent with every reply, next to the conversation. The chat refuses a request
 * once the whole prompt passes 100,000 characters, so a definition above this size would leave a character that
 * can never answer. This is the one limit that is enforced for real.
 */
export const MAX_DEFINITION_CHARACTERS = 60_000;

/** A rough count (about four characters per token). It is an estimate, not what a given model will count. */
export function estimateTokens(value: string): number {
  return Math.ceil(value.trim().length / 4);
}

export interface CharacterForm {
  name: string;
  /** Optional nickname used in chats and by the AI. Empty means the name is used. */
  chatName: string;
  /** Public URL of the character's picture. Empty means none. */
  avatarUrl: string;
  /** How they speak. */
  style: string;
  /** Things they know about their world. */
  lore: string;
  /** Phrases the AI should quietly avoid. */
  avoid: string;
  /** Extra guidance for the AI from the creator. */
  notes: string;
  tagline: string;
  greeting: string;
  scenario: string;
  personality: string;
  /** A complete written definition (codex, world and rules). Read by the AI as "Detailed Character Definition", right after the personality. */
  definition: string;
  about: string;
  examples: string;
  category: string;
  tags: string;
  visibility: Visibility;
  /** Rated Mature instead of General. Only members who confirmed they are 18 or older can choose it. */
  mature: boolean;
}

export const EMPTY_FORM: CharacterForm = {
  name: '',
  chatName: '',
  avatarUrl: '',
  style: '',
  lore: '',
  avoid: '',
  notes: '',
  tagline: '',
  greeting: '',
  scenario: '',
  personality: '',
  definition: '',
  about: '',
  examples: '',
  category: 'General',
  tags: '',
  visibility: 'private',
  mature: false,
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

/** Row as stored. Fields the form does not show are carried through unchanged on edit. */
export type CharacterRecord = Record<string, unknown> & { id: string };

function text(row: CharacterRecord | null, key: string, fallback = ''): string {
  const value = row?.[key];
  return typeof value === 'string' ? value : fallback;
}

/**
 * Fields that reach the chat prompt but are not in the form. They are kept as they were on edit, so they still count.
 * (Old characters can have them; the form never writes them.)
 */
const HIDDEN_PROMPT_FIELDS = ['system_definition', 'rp_definition', 'example_conversations'] as const;

/**
 * What the AI receives with every reply, in characters. The bio is only shown on cards, so it does not count.
 * The opening message is counted twice: a new scene sends it in the system prompt and again in the opening turn
 * (api/ai-chat.ts). Fields kept from an older version of the character count too.
 */
export function definitionSize(form: CharacterForm, existing: CharacterRecord | null = null): number {
  const written = [form.tagline, form.greeting, form.greeting, form.scenario, form.personality, form.definition, form.examples, form.style, form.lore, form.avoid, form.notes]
    .reduce((total, value) => total + value.trim().length, 0);
  const kept = HIDDEN_PROMPT_FIELDS.reduce((total, key) => total + text(existing, key).trim().length, 0);
  return written + kept;
}

/** What is still missing before the character can be created, in plain words. Empty when it is ready. */
export function missingForCreate(form: CharacterForm): string[] {
  const missing: string[] = [];
  if (!form.name.trim()) missing.push('a name');
  if (!form.personality.trim()) missing.push('a personality');
  if (!form.greeting.trim()) missing.push('an opening message');
  return missing;
}

/** Returns a readable problem, or null when the form can be saved. */
export function validateForm(form: CharacterForm, existing: CharacterRecord | null = null): string | null {
  if (!form.name.trim()) return 'Give your character a name.';
  if (!form.greeting.trim()) return 'Write the first message your character says to open a scene.';
  if (!form.personality.trim()) return 'Describe their personality so they stay in character.';
  const checks: Array<[string, string, number]> = [
    ['Name', form.name, LIMITS.name],
    ['Chat name', form.chatName, LIMITS.chatName],
    ['Tagline', form.tagline, LIMITS.tagline],
    ['Phrases to avoid', form.avoid, LIMITS.avoid],
  ];
  for (const [label, value, max] of checks) {
    if (value.length > max) return `${label} is too long to be shown. Please shorten it.`;
  }
  const size = definitionSize(form, existing);
  if (size > MAX_DEFINITION_CHARACTERS) {
    const over = estimateTokens('x'.repeat(size - MAX_DEFINITION_CHARACTERS));
    return `This character is too long for chats to work reliably: every reply carries the whole definition. Please shorten it by about ${over.toLocaleString()} tokens.`;
  }
  return null;
}

/** General unless the form says Mature. A stored NSFW rating stays NSFW while the character stays adult. */
function ratingToSave(form: CharacterForm, existing: CharacterRecord | null): 'SFW' | 'Mature' | 'NSFW' {
  if (!form.mature) return 'SFW';
  return (text(existing, 'content_rating', 'SFW') || 'SFW').toUpperCase() === 'NSFW' ? 'NSFW' : 'Mature';
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
    // The nickname used in chats and by the AI; the name itself when there is none.
    p_chat_name: form.chatName.trim() || name,
    p_greeting: form.greeting.trim(),
    p_short_description: form.tagline.trim(),
    p_long_description: form.about.trim(),
    p_personality: form.personality.trim(),
    p_scenario: form.scenario.trim(),
    p_example_dialogues: form.examples.trim(),
    p_conversation_style: form.style.trim(),
    p_knowledge: form.lore.trim(),
    p_tags: parseTags(form.tags),
    p_category: form.category,
    p_visibility: form.visibility,
    p_avatar_url: form.avatarUrl.trim(),
    p_banner_url: text(existing, 'banner_url'),
    p_content_rating: ratingToSave(form, existing),
    p_creator_notes: form.notes.trim(),
    p_example_conversations: text(existing, 'example_conversations'),
    p_rp_definition: text(existing, 'rp_definition'),
    p_system_definition: text(existing, 'system_definition'),
    p_system_character_definition: form.definition.trim(),
    p_alternate_greetings: Array.isArray(existing?.alternate_greetings) ? existing?.alternate_greetings : [],
    p_banned_words: form.avoid.trim(),
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

export function formFromRecord(row: CharacterRecord, displayName = ''): CharacterForm {
  const visibility = text(row, 'visibility', 'private');
  const chatName = text(row, 'chat_name');
  // The name is the profile's display name. Older characters only have the chat name, which was the name.
  const name = displayName || chatName;
  return {
    name,
    chatName: chatName && chatName !== name ? chatName : '',
    avatarUrl: text(row, 'avatar_url'),
    tagline: text(row, 'short_description'),
    greeting: text(row, 'greeting'),
    scenario: text(row, 'scenario'),
    personality: text(row, 'personality'),
    definition: text(row, 'system_character_definition'),
    about: text(row, 'long_description'),
    examples: text(row, 'example_dialogues'),
    style: text(row, 'conversation_style'),
    lore: text(row, 'knowledge'),
    avoid: text(row, 'banned_words'),
    notes: text(row, 'creator_notes'),
    category: text(row, 'category', 'General') || 'General',
    tags: Array.isArray(row.tags) ? (row.tags as string[]).join(', ') : '',
    visibility: (['private', 'unlisted', 'public'] as const).includes(visibility as Visibility) ? (visibility as Visibility) : 'private',
    mature: (text(row, 'content_rating', 'SFW') || 'SFW').toUpperCase() !== 'SFW',
  };
}
