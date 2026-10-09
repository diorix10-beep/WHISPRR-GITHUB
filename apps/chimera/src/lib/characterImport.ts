import { EMPTY_FORM, LIMITS, parseTags, type CharacterForm } from './characters';

/**
 * Reads a "character card" made elsewhere (the Tavern / SillyTavern V1, V2 and V3 formats, as a
 * .json file or as a .png with the card embedded) and turns it into the CHIMERA character form.
 *
 * The result only FILLS THE FORM. Nothing is saved until the person reviews it and presses Create,
 * and it is always private by default. The reading is done in the browser; the file never leaves it.
 */

export const MAX_CARD_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CARD_TEXT_CHARACTERS = 1_500_000;

export interface ImportNotes {
  /** Which card format was read, for display. */
  format: string;
  /** Fields that were longer than CHIMERA allows and were shortened. */
  trimmed: Array<{ field: string; from: number; to: number }>;
  /** Things in the card that were deliberately not imported. */
  leftOut: string[];
  /** Placeholders the importer did not know how to translate and left as written. */
  placeholders: string[];
  /** The file was a picture. Its image is not used yet (characters have no avatar upload). */
  picture: boolean;
}

export interface ImportResult {
  form: CharacterForm;
  notes: ImportNotes;
}

export class CardImportError extends Error {}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function isPng(bytes: Uint8Array): boolean {
  return bytes.length > 8 && PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

function latin1(bytes: Uint8Array, start: number, end: number): string {
  let out = '';
  for (let index = start; index < end; index += 1) out += String.fromCharCode(bytes[index]);
  return out;
}

/** The text a PNG carries under the `ccv3` or `chara` keyword, or null when it has none. */
export function extractPngCardText(bytes: Uint8Array): string | null {
  if (!isPng(bytes)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const found = new Map<string, string>();
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = latin1(bytes, offset + 4, offset + 8);
    const start = offset + 8;
    const end = start + length;
    if (end + 4 > bytes.length) break;
    if (type === 'tEXt') {
      const separator = bytes.indexOf(0, start);
      if (separator > start && separator < end) found.set(latin1(bytes, start, separator), latin1(bytes, separator + 1, end));
    } else if (type === 'iTXt') {
      const separator = bytes.indexOf(0, start);
      // keyword, 0, compression flag, compression method, language tag, 0, translated keyword, 0, text
      if (separator > start && separator + 3 < end && bytes[separator + 1] === 0) {
        const languageEnd = bytes.indexOf(0, separator + 3);
        const translatedEnd = languageEnd >= 0 ? bytes.indexOf(0, languageEnd + 1) : -1;
        if (translatedEnd >= 0 && translatedEnd < end) {
          found.set(latin1(bytes, start, separator), new TextDecoder().decode(bytes.subarray(translatedEnd + 1, end)));
        }
      }
    } else if (type === 'IEND') {
      break;
    }
    offset = end + 4;
  }
  return found.get('ccv3') ?? found.get('chara') ?? null;
}

function decodeCardText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;
  try {
    const binary = atob(trimmed.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new CardImportError('The character data inside this picture could not be read.');
  }
}

/** Turns the raw bytes of a .png or .json card into the card's JSON value. */
export function readCardBytes(bytes: Uint8Array): unknown {
  if (bytes.length > MAX_CARD_FILE_BYTES) throw new CardImportError('This file is too large. Cards are usually well under 10 MB.');
  let text: string;
  if (isPng(bytes)) {
    const embedded = extractPngCardText(bytes);
    if (!embedded) throw new CardImportError('This picture has no character card inside it.');
    text = decodeCardText(embedded);
  } else {
    text = new TextDecoder().decode(bytes);
  }
  if (text.length > MAX_CARD_TEXT_CHARACTERS) throw new CardImportError('This card is too large to import.');
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new CardImportError('This file is not a character card. Use a .png card or a .json export.');
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);

/** The card's own fields, whichever version it is. Null when it does not look like a character card. */
function cardData(raw: unknown): { data: Json; format: string } | null {
  if (!isObject(raw)) return null;
  const spec = typeof raw.spec === 'string' ? raw.spec : '';
  if (isObject(raw.data) && spec.startsWith('chara_card')) {
    return { data: raw.data, format: spec === 'chara_card_v3' ? 'Character Card V3' : 'Character Card V2' };
  }
  if (isObject(raw.data) && typeof raw.data.name === 'string') return { data: raw.data, format: 'Character Card' };
  if (typeof raw.name === 'string' || typeof raw.first_mes === 'string' || typeof raw.char_name === 'string') {
    return { data: raw, format: 'Character Card V1' };
  }
  return null;
}

const str = (data: Json, key: string): string => (typeof data[key] === 'string' ? (data[key] as string).replace(/\r\n?/g, '\n').trim() : '');

/**
 * Cards use {{char}} and {{user}}. CHIMERA writes the player's name or "the player" itself, so the
 * placeholders become plain words. `spoken` text (the opening message, example dialogue) speaks to the
 * player as "you"; descriptions talk about "the player".
 */
function applyPlaceholders(text: string, name: string, spoken: boolean, unknown: Set<string>): string {
  let out = text
    .replace(/\{\{\s*\/\/[\s\S]*?\}\}/g, '')
    // A speaker label in example dialogue ("{{user}}: Hi") is the player, not "you:".
    .replace(/^([ \t]*)(?:\{\{\s*user\s*\}\}|<\s*USER\s*>)\s*:/gim, '$1Player:')
    .replace(/\{\{\s*char\s*\}\}|<\s*BOT\s*>/gi, name || 'the character')
    .replace(/(\{\{\s*user\s*\}\}|<\s*USER\s*>)['’]s\b/gi, spoken ? 'your' : "the player's")
    .replace(/\{\{\s*user\s*\}\}|<\s*USER\s*>/gi, spoken ? 'you' : 'the player');
  out = out.replace(/\{\{[^{}]{1,60}\}\}/g, (match) => {
    unknown.add(match);
    return match;
  });
  return out.trim();
}

/** Cuts at a paragraph or sentence end near the limit, so a shortened text still ends cleanly. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const floor = Math.floor(max * 0.85);
  let cut = -1;
  // [what to look for, how much of it to keep]
  for (const [mark, keep] of [['\n\n', 0], ['. ', 1], ['! ', 1], ['? ', 1], ['.\n', 1], ['\n', 0]] as const) {
    const at = head.lastIndexOf(mark);
    if (at >= floor) cut = Math.max(cut, at + keep);
  }
  return (cut > 0 ? head.slice(0, cut) : head).trim();
}

const ADULT_TAG = /^(nsfw|18\+|r-?18|explicit|porn|smut|erotic|lewd)$/i;
const ADULT_NOTE = /\bnsfw\b|\b18\+|\br-?18\b/i;
// "SFW only", "non-NSFW", "no NSFW" in the creator's notes say the opposite.
const NOT_ADULT_NOTE = /\bsfw\b|\bnon-?nsfw\b|\b(?:no|not|without)\s+nsfw\b/i;

/** True when the card says it is adult content (a tag, or the creator's notes). */
export function isMarkedAdult(tags: string[], notes: string): boolean {
  return tags.some((tag) => ADULT_TAG.test(tag.trim())) || (ADULT_NOTE.test(notes) && !NOT_ADULT_NOTE.test(notes));
}

export interface ImportOptions {
  /** The member may use Mature characters (confirmed 18+, adult content on). A card marked adult then arrives as Mature. */
  allowAdult?: boolean;
}

export function cardToForm(raw: unknown, { allowAdult = false }: ImportOptions = {}): ImportResult {
  const card = cardData(raw);
  if (!card) throw new CardImportError('This does not look like a character card. It needs at least a name and a first message.');
  const { data, format } = card;

  const unknown = new Set<string>();
  const trimmed: ImportNotes['trimmed'] = [];
  const fit = (field: string, value: string, max: number): string => {
    if (value.length <= max) return value;
    const shortened = clip(value, max);
    trimmed.push({ field, from: value.length, to: shortened.length });
    return shortened;
  };

  const name = fit('Name', (str(data, 'name') || str(data, 'char_name')).replace(/\s+/g, ' '), LIMITS.name);
  // {{char}} means the V3 nickname when there is one, otherwise the name that is actually saved.
  const macroName = str(data, 'nickname').replace(/\s+/g, ' ').slice(0, LIMITS.name) || name;
  const text = (key: string, spoken = false) => applyPlaceholders(str(data, key) || (key === 'first_mes' ? str(data, 'greeting') : ''), macroName, spoken, unknown);

  // In a card, "description" is the main definition and "personality" a short summary of it.
  const personality = [text('description'), text('personality')].filter(Boolean).join('\n\n');
  const tags = Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [];
  const notes = str(data, 'creator_notes') || str(data, 'creatorcomment');
  // A card marked adult is never relabelled General: that would hand its explicit text to anyone the character is
  // shared with. It is refused, unless the member may use Mature, and then it arrives rated Mature.
  const adult = isMarkedAdult(tags, notes);
  if (adult && !allowAdult) {
    throw new CardImportError('This card is marked as adult content (NSFW). To import it, confirm in the Guardian\'s Library that you are 18 or older and turn on adult content.');
  }

  const leftOut: string[] = [];
  if (str(data, 'system_prompt') || str(data, 'post_history_instructions')) {
    leftOut.push('Custom system instructions (CHIMERA uses its own safety rules)');
  }
  const book = isObject(data.character_book) ? data.character_book : null;
  if (book && Array.isArray(book.entries) && book.entries.length > 0) leftOut.push(`Lorebook with ${book.entries.length} ${book.entries.length === 1 ? 'entry' : 'entries'} (not supported yet)`);
  const alternates = Array.isArray(data.alternate_greetings) ? data.alternate_greetings.filter((g) => typeof g === 'string' && g.trim()) : [];
  if (alternates.length > 0) leftOut.push(`${alternates.length} alternate opening ${alternates.length === 1 ? 'message' : 'messages'} (not supported yet)`);

  const form: CharacterForm = {
    ...EMPTY_FORM,
    name,
    // A V3 card's nickname is what the character is called in chats: the same thing as the chat name here.
    chatName: macroName !== name ? macroName : '',
    greeting: fit('Opening message', text('first_mes', true), LIMITS.greeting),
    scenario: fit('Scenario', text('scenario'), LIMITS.scenario),
    personality: fit('Personality', personality, LIMITS.personality),
    examples: fit('Example dialogue', text('mes_example', true), LIMITS.examples),
    about: fit('About', applyPlaceholders(notes, macroName, false, unknown), LIMITS.about),
    tags: parseTags(tags.join(', ')).join(', '),
    visibility: 'private',
    mature: adult,
  };

  return {
    form,
    notes: {
      format,
      trimmed,
      leftOut,
      placeholders: Array.from(unknown).slice(0, 6),
      picture: false,
    },
  };
}

/** Reads a File chosen in the browser. */
export async function importCardFile(file: File, options: ImportOptions = {}): Promise<ImportResult> {
  if (file.size > MAX_CARD_FILE_BYTES) throw new CardImportError('This file is too large. Cards are usually well under 10 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = cardToForm(readCardBytes(bytes), options);
  result.notes.picture = isPng(bytes);
  return result;
}
