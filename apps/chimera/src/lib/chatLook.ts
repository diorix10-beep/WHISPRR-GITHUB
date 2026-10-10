/**
 * How the player likes their chats to look: text size, spacing, alignment, bubbles, typeface, and how narration (*actions*)
 * and dialogue ("quoted") are shown. It only changes how messages are drawn, never what they say or what is stored. It is kept in
 * this browser (not in the account), so it follows the device, and a browser that refuses storage simply uses the defaults.
 */

export const LOOK_OPTIONS = {
  size: [
    { id: 's', label: 'Small', hint: '15 px' },
    { id: 'm', label: 'Default', hint: '17 px' },
    { id: 'l', label: 'Large', hint: '19 px' },
    { id: 'xl', label: 'Larger', hint: '22 px' },
  ],
  spacing: [
    { id: 'compact', label: 'Compact', hint: 'More messages on the screen' },
    { id: 'comfortable', label: 'Comfortable', hint: 'The default' },
    { id: 'airy', label: 'Airy', hint: 'More room around each message' },
  ],
  align: [
    { id: 'sides', label: 'Two sides', hint: 'You on the right, the character on the left' },
    { id: 'left', label: 'All on the left', hint: 'Like a script or a book' },
  ],
  bubble: [
    { id: 'rounded', label: 'Rounded', hint: 'The default' },
    { id: 'square', label: 'Square', hint: 'Sharper corners' },
    { id: 'plain', label: 'No bubble', hint: 'Plain text, a thin line marks your messages' },
  ],
  font: [
    { id: 'sans', label: 'Clean', hint: 'The default' },
    { id: 'serif', label: 'Book', hint: 'A reading typeface' },
  ],
  narration: [
    { id: 'italic', label: 'Italic', hint: 'The default' },
    { id: 'soft', label: 'Italic, softer', hint: 'A quieter colour' },
    { id: 'gold', label: 'Italic, gold', hint: 'Stands out' },
    { id: 'upright', label: 'Not slanted', hint: 'Easier to read for some people' },
  ],
  dialogue: [
    { id: 'normal', label: 'Normal', hint: 'The default' },
    { id: 'gold', label: 'Gold', hint: 'Quoted words in gold' },
    { id: 'bold', label: 'Bold', hint: 'Quoted words in bold' },
  ],
} as const;

export type LookKey = keyof typeof LOOK_OPTIONS;
export type ChatLook = { [K in LookKey]: (typeof LOOK_OPTIONS)[K][number]['id'] };

export const DEFAULT_LOOK: ChatLook = {
  size: 'm',
  spacing: 'comfortable',
  align: 'sides',
  bubble: 'rounded',
  font: 'sans',
  narration: 'italic',
  dialogue: 'normal',
};

export const LOOK_KEYS = Object.keys(LOOK_OPTIONS) as LookKey[];
const STORAGE_KEY = 'chimera.chat.look';

/** Keeps every choice that is one of the known options and puts the default back for anything else (old, edited or broken data). */
export function normalizeLook(raw: unknown): ChatLook {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_LOOK } as Record<LookKey, string>;
  for (const key of LOOK_KEYS) {
    const value = source[key];
    if (LOOK_OPTIONS[key].some((option) => option.id === value)) out[key] = value as string;
  }
  return out as ChatLook;
}

export const isDefaultLook = (look: ChatLook) => LOOK_KEYS.every((key) => look[key] === DEFAULT_LOOK[key]);

/** The attributes the stylesheet reads (see `.chat-look` in index.css). */
export function lookAttributes(look: ChatLook): Record<string, string> {
  return {
    'data-size': look.size,
    'data-spacing': look.spacing,
    'data-align': look.align,
    'data-bubble': look.bubble,
    'data-font': look.font,
    'data-narration': look.narration,
    'data-dialogue': look.dialogue,
  };
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readLook(storage: Pick<Storage, 'getItem'> | null = safeStorage()): ChatLook {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    return text ? normalizeLook(JSON.parse(text)) : { ...DEFAULT_LOOK };
  } catch {
    return { ...DEFAULT_LOOK };
  }
}

/** Saves the choices, or forgets them all when they are the defaults. Returns false when the browser refused. */
export function writeLook(look: ChatLook, storage: Pick<Storage, 'setItem' | 'removeItem'> | null = safeStorage()): boolean {
  try {
    if (!storage) return false;
    if (isDefaultLook(look)) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify(look));
    return true;
  } catch {
    return false;
  }
}

export const LOOK_STORAGE_KEY = STORAGE_KEY;
