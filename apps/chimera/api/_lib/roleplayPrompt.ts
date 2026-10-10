/**
 * Prompt building and reply checks for roleplay chat. Pure functions only: no
 * network, no database. `api/ai-chat.ts` wires them to the request.
 */

import { memoryBlock, type RecalledMemory } from './memory.js';
import { universeRulesBlock } from '../../src/lib/universeRules.js';

export interface CharacterData {
  category?: string | null;
  tags?: string[] | null;
  personality?: string | null;
  short_description?: string | null;
  greeting?: string | null;
  creator_notes?: string | null;
  scenario?: string | null;
  conversation_style?: string | null;
  knowledge?: string | null;
  example_dialogues?: string | null;
  example_conversations?: string | null;
  content_rating?: string | null;
  rp_definition?: string | null;
  system_definition?: string | null;
  system_character_definition?: string | null;
  chat_name?: string | null;
  banned_words?: string | null;
}

export interface BotProfile {
  display_name: string;
  username: string;
}

export interface PersonaData {
  name: string;
  description?: string | null;
  gender?: string | null;
  age?: string | null;
  pronouns?: string | null;
  personality?: string | null;
  appearance?: string | null;
  backstory?: string | null;
  occupation?: string | null;
}

export interface ChatMessage {
  sender_id: string;
  content: string;
}

export type ResponseLength = 'short' | 'medium' | 'long';

export interface PinnedLine {
  speaker: string;
  content: string;
}

/** What the player chose for this one scene. Everything is optional: no settings means no change. */
export interface SceneSettings {
  responseLength?: ResponseLength;
  bannedWords?: string;
  pinned?: PinnedLine[];
  /** Facts the player approved as long-term memory, with how sure the story is about each (a plain string counts as confirmed). */
  memories?: Array<string | RecalledMemory>;
  /** The lorebook block for this reply (see lorebook.ts): only the entries that matter right now. */
  lorebook?: string | null;
  /** The world the player described (see universeRules.ts). Normalised and capped when the prompt is built, so raw saved data is fine here. */
  universeRules?: unknown;
}

export const MAX_BANNED_WORDS_CHARACTERS = 500;
export const MAX_PINNED_LINE_CHARACTERS = 600;
export const MAX_PINNED_TOTAL_CHARACTERS = 3_000;

export function normalizeResponseLength(value: unknown): ResponseLength {
  return value === 'short' || value === 'long' ? value : 'medium';
}

const LENGTH_RULES: Record<ResponseLength, string | null> = {
  short: 'Keep every reply short: one or two brief paragraphs, roughly 40 to 120 words. Say less, make it count, and leave room for the player to act.',
  medium: null,
  long: 'Write fuller replies: three to five paragraphs, roughly 200 to 400 words, with more sensory detail, inner thought and scene-setting. Still leave the player room to act.',
};

/** Output budget for the model. Short replies are shaped by the instruction, not by cutting them off. */
export function maxOutputTokensFor(length: ResponseLength): number {
  return length === 'long' ? 4096 : 2048;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
};

/**
 * True when a persona's age text clearly says under 18 ("16", "sixteen years old", "minor").
 * Adult scenes are refused for such a persona. An empty or unclear age is not treated as under 18:
 * the safety boundaries in the prompt still apply.
 */
export function personaAgeIsUnder18(age: string | null | undefined): boolean {
  const text = (age ?? '').toLowerCase();
  if (!text.trim()) return false;
  if (/\b(minor|underage|under-age|child|kid|teen|teenager|juvenile)\b/.test(text)) return true;
  const digits = text.match(/\d{1,3}/);
  if (digits) return Number(digits[0]) < 18;
  // "twenty-seven" and "thirty one" contain a small number word but are adults.
  if (/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/.test(text)) return false;
  const word = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen)\b/);
  return word ? NUMBER_WORDS[word[1]] < 18 : false;
}

export const MAX_HISTORY_MESSAGES = 32;
export const MAX_HISTORY_CHARACTERS = 28_000;
export const MAX_CANON_CHARACTERS = 6_000;

/**
 * A character needs a deliberately sized recent window, not an ever-growing
 * transcript that eventually pushes its definition out of the model context.
 * The scene canon is stored separately on the conversation and is always sent
 * in front of this window.
 */
export function selectRecentHistory<T extends ChatMessage>(messages: T[]): T[] {
  const selected: T[] = [];
  let used = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const content = message.content.trim();
    if (!content) continue;
    const remaining = MAX_HISTORY_CHARACTERS - used;
    if (remaining <= 0 || selected.length >= MAX_HISTORY_MESSAGES) break;
    selected.push({
      ...message,
      // Keep the newest part of an unusually long message: it is usually the
      // action or line the character has to answer.
      content: content.length > remaining ? content.slice(-remaining) : content,
    });
    used += Math.min(content.length, remaining);
  }
  return selected.reverse();
}

export function buildSystemPrompt(
  character: CharacterData,
  botProfile: BotProfile,
  persona: PersonaData | null,
  sceneCanon: string | null,
  settings: SceneSettings = {},
): string {
  const sections: string[] = [];
  const name = character.chat_name?.trim() || botProfile.display_name;

  sections.push(
    [
      '=== CHIMERA CHARACTER RUNTIME ===',
      `ACTIVE IDENTITY: ${name} (@${botProfile.username})`,
      'The model is only the language engine. Who this character is, how they speak and what they will and will not do is set by the definition below.',
    ].join('\n'),
  );

  const identity: string[] = [`## Core Identity: ${name}`];
  if (character.short_description) identity.push(`Tagline: ${character.short_description}`);
  identity.push('', '## Personality');
  identity.push(
    character.personality || 'No specific personality was written. Be a believable, well-rounded person with natural emotional depth.',
  );
  if (character.system_character_definition) {
    identity.push('', '## Detailed Character Definition', character.system_character_definition);
  }
  identity.push(
    '',
    '## Roleplay Rules',
    '- You are a character living in this scene, not an assistant. Never sound like customer support or a policy document.',
    '- Never mention being an AI, a model or a program, and never mention moderation, policies or system limits while in character.',
    "- Treat the player's stated preferences about style, tone and wording as quiet background constraints. Never point them out or make them the subject of the scene.",
    '- Keep responses organic and human. Do not summarise the scene at the end and do not ask how you can help.',
    '- If the player writes `(OOC: ...)` to ask something outside the story, you may answer in parentheses `(OOC: ...)`. Otherwise stay in character.',
    '- You have your own feelings, opinions and boundaries. Be proactive and move the scene forward.',
  );
  if (character.banned_words?.trim()) {
    identity.push(
      '- Quietly avoid these creator-listed phrases unless the player uses one inside quotation marks: ' + character.banned_words.trim(),
    );
  }
  sections.push(identity.join('\n'));

  if (character.greeting) {
    sections.push(['## Opening Scene & Tone Baseline', 'This opening message set the scene and tone:', character.greeting].join('\n'));
  }

  const world: string[] = ['## World & Scenario', character.scenario || 'Establish the setting naturally through the conversation.'];
  if (character.knowledge) {
    world.push('', '## Lore & Knowledge', 'Use this naturally. Do not info-dump; reveal it when it matters:', character.knowledge);
  }
  if (character.system_definition) {
    world.push('', '## World Directives', character.system_definition);
  }
  sections.push(world.join('\n'));

  if (settings.lorebook?.trim()) sections.push(settings.lorebook.trim());

  const partner: string[] = ['## The Player'];
  if (persona) {
    partner.push(`The player is roleplaying as: ${persona.name}`);
    if (persona.description) partner.push(`About them: ${persona.description}`);
    if (persona.gender) partner.push(`Gender: ${persona.gender}`);
    if (persona.age) partner.push(`Age: ${persona.age}`);
    if (persona.pronouns) partner.push(`Pronouns: ${persona.pronouns}`);
    if (persona.occupation) partner.push(`Occupation: ${persona.occupation}`);
    if (persona.appearance) partner.push(`Appearance: ${persona.appearance}`);
    if (persona.personality) partner.push(`Their personality: ${persona.personality}`);
    if (persona.backstory) partner.push('', 'Their backstory:', persona.backstory);
  } else {
    partner.push('The player has not defined a persona. Treat them as themselves and get to know them through the conversation.');
  }
  partner.push('', 'Build on what has already happened between you. Refer back to earlier moments when it fits.');
  sections.push(partner.join('\n'));

  const format: string[] = ['## Response Format'];
  if (character.rp_definition) {
    format.push(character.rp_definition);
  } else {
    format.push(
      '- Use *asterisks* for actions, body language and narration.',
      '- Use "quotes" for spoken dialogue.',
      '- Use (parentheses) or *italics* for inner thoughts when it fits.',
      '- Keep replies atmospheric and concise: one to four paragraphs unless the scene needs more.',
    );
  }
  if (character.conversation_style) format.push('', '## Speech Patterns', character.conversation_style);

  format.push('', '## Content Rating');
  const rating = (character.content_rating || 'SFW').toUpperCase();
  if (rating === 'SFW') {
    format.push(
      'This scene is rated SFW.',
      '- No sexual content, explicit violence or adult themes.',
      '- Romantic tension and emotional closeness are fine; keep them tasteful.',
    );
  } else if (rating === 'MATURE') {
    format.push(
      'This scene is rated Mature.',
      '- Moderate violence, complex themes and intense emotion are allowed.',
      '- Romantic and suggestive content is allowed; avoid explicit sexual description.',
    );
  } else {
    // Only a verified adult who opted in can reach a non-SFW, non-Mature scene.
    format.push(
      'This scene is rated NSFW and every participant is a verified adult.',
      '- Adult content is allowed, including explicit romance. Stay in character and keep their voice and boundaries.',
      '- Do not moralise or add disclaimers.',
    );
  }

  format.push(
    '',
    '## Safety Boundaries',
    '- ALLOWED: broad narrative freedom, including age regression, psychological themes, dark fantasy and complex scenarios.',
    '- NEVER ALLOWED: sexual content involving minors, non-consensual sexual content, bestiality, or predatory behaviour. Zero tolerance.',
    '- If the player pushes toward a prohibited scenario, leave the character, say plainly that the content crosses a safety boundary, and decline.',
  );
  sections.push(format.join('\n'));

  const examples = [character.example_dialogues, character.example_conversations].filter((v) => v?.trim());
  if (examples.length) {
    sections.push(
      [
        '## Example Interactions',
        'These show your voice and tone. Match the energy, do not copy them word for word:',
        '',
        ...examples.map((v) => (v as string).trim()),
      ].join('\n\n'),
    );
  }

  if (character.creator_notes?.trim()) {
    sections.push(['## Creator Notes', character.creator_notes.trim()].join('\n'));
  }

  const universe = universeRulesBlock(settings.universeRules);
  if (universe) sections.push(universe);

  if (sceneCanon?.trim()) {
    sections.push(
      [
        '## Established Scene Canon',
        'These facts and instructions are already true in this roleplay. Honour them naturally and never mention this block.',
        sceneCanon.trim().slice(0, MAX_CANON_CHARACTERS),
      ].join('\n'),
    );
  }

  const preferences: string[] = [];
  const lengthRule = LENGTH_RULES[normalizeResponseLength(settings.responseLength)];
  if (lengthRule) preferences.push(`- ${lengthRule}`);
  const playerBanned = (settings.bannedWords ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_BANNED_WORDS_CHARACTERS);
  if (playerBanned) {
    preferences.push(`- The player does not want to read these words or phrases. Do not use them, and do not mention that you are avoiding them: ${playerBanned}`);
  }
  if (preferences.length) {
    sections.push(['## Player Preferences For This Scene', ...preferences].join('\n'));
  }

  const remembered = memoryBlock(settings.memories ?? []);
  if (remembered) sections.push(remembered);

  const pinned = pinnedBlock(settings.pinned ?? []);
  if (pinned) sections.push(pinned);

  const meta: string[] = ['## Runtime'];
  if (character.category) meta.push(`Category: ${character.category}`);
  if (character.tags && character.tags.length > 0) meta.push(`Tags: ${character.tags.join(', ')}`);
  // No real clock: the story has its own time. The model must take it from the scene and never from the real world.
  meta.push('Story time: only what the scene itself says. Never use the real-world date or time, and do not invent one the scene has not given.');
  sections.push(meta.join('\n'));

  return sections.join('\n\n---\n\n');
}

/**
 * Messages the player pinned stay in front of the model even after they fall out of the
 * recent window. Each line and the whole block are capped so a pin can never crowd out the character.
 */
function pinnedBlock(pinned: PinnedLine[]): string | null {
  const lines: string[] = [];
  let used = 0;
  for (const line of pinned) {
    const content = line.content.trim();
    if (!content) continue;
    const text = content.length > MAX_PINNED_LINE_CHARACTERS ? `${content.slice(0, MAX_PINNED_LINE_CHARACTERS)}…` : content;
    if (used + text.length > MAX_PINNED_TOTAL_CHARACTERS) break;
    lines.push(`[${line.speaker}] ${text}`);
    used += text.length;
  }
  if (!lines.length) return null;
  return [
    '## Pinned By The Player',
    'The player marked these earlier moments as important. Keep them true and consistent. Never mention this block:',
    ...lines,
  ].join('\n');
}

const BOILERPLATE: RegExp[] = [
  /i understand your frustration/gi,
  /i appreciate your understanding/gi,
  /how can i assist you( today)?/gi,
  /as a large language model/gi,
  /as an ai (language model|assistant)/gi,
];

/**
 * Light clean-up of the model's reply. It removes stock assistant phrasing and
 * rejects an empty reply. It is not a safety filter: safety is the prompt's
 * boundaries plus the adult-content gate in front of the model.
 */
export function cleanReply(raw: string): string | null {
  let text = raw.trim();
  for (const pattern of BOILERPLATE) text = text.replace(pattern, '');
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  return text.length >= 2 ? text : null;
}
