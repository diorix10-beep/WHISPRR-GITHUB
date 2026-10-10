/**
 * Chat backgrounds: ready-made CHIMERA backgrounds (gradients and solid colours), a colour of the player's own, or a picture that
 * stays on the player's device. It only changes what is drawn behind a chat. Text must stay readable on every one of them: each
 * background has a brightest point, and a dark layer over it is never lighter than what keeps the lightest text colour used in
 * chats above 4.5:1 contrast. The choice is kept in this browser (the picture itself is in `wallpaperStore.ts`).
 */

export interface Preset {
  id: string;
  label: string;
  /** What is drawn: a CSS background value built only from the colours below. */
  css: string;
  /** The brightest colour a person can see in it. Used to prove the text stays readable. */
  peak: string;
}

/** The lightest text colours chats use (ink, the character's text, softer narration, gold narration and dialogue). */
export const LIGHT_TEXT_COLORS = ['#f6ecd8', '#f5f3ff', '#cfc3dd', '#e8c27a'] as const;
/** Text must reach this contrast on the background (WCAG AA for normal text). */
export const MIN_CONTRAST = 4.5;
/** The most the player can dim a background. */
export const MAX_DIM = 0.9;

export const PRESETS: Preset[] = [
  { id: 'midnight', label: 'Midnight', css: 'linear-gradient(160deg, #0b0820 0%, #241046 55%, #3b1a5a 100%)', peak: '#3b1a5a' },
  { id: 'ember', label: 'Ember', css: 'linear-gradient(160deg, #1a0c10 0%, #3d1620 55%, #5a2430 100%)', peak: '#5a2430' },
  { id: 'deepsea', label: 'Deep sea', css: 'linear-gradient(160deg, #06141f 0%, #0b3347 60%, #0f4a55 100%)', peak: '#0f4a55' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(160deg, #07130d 0%, #123222 60%, #1b4531 100%)', peak: '#1b4531' },
  { id: 'dusk', label: 'Dusk', css: 'linear-gradient(160deg, #0d0b24 0%, #2a1b4d 55%, #5e2f56 100%)', peak: '#5e2f56' },
  { id: 'gilded', label: 'Gilded', css: 'radial-gradient(circle at 18% 8%, #3d3018 0%, transparent 45%), linear-gradient(160deg, #0d0b14 0%, #1b1626 100%)', peak: '#3d3018' },
  { id: 'rose-glow', label: 'Rose glow', css: 'radial-gradient(circle at 85% 12%, #4a2230 0%, transparent 48%), linear-gradient(160deg, #0d0a12 0%, #1a1220 100%)', peak: '#4a2230' },
  { id: 'ink', label: 'Ink', css: '#0b0a10', peak: '#0b0a10' },
  { id: 'plum', label: 'Plum', css: '#1c1030', peak: '#1c1030' },
  { id: 'slate', label: 'Slate', css: '#141a26', peak: '#141a26' },
  { id: 'wine', label: 'Wine', css: '#2a0f1a', peak: '#2a0f1a' },
  { id: 'moss', label: 'Moss', css: '#112218', peak: '#112218' },
];

export type WallpaperChoice =
  | { kind: 'none' }
  | { kind: 'preset'; id: string }
  | { kind: 'color'; color: string }
  /** A picture kept on this device. `luminance` is how bright its brighter parts are (0 to 1), measured when it was chosen. */
  | { kind: 'image'; luminance: number };

export interface WallpaperSetting {
  choice: WallpaperChoice;
  /** How much the player wants the background dimmed (0 to 0.9). The least needed for readable text is applied whatever this says. */
  dim: number;
}

export const DEFAULT_WALLPAPER: WallpaperSetting = { choice: { kind: 'none' }, dim: 0 };
const STORAGE_KEY = 'chimera.chat.wallpaper';
export const WALLPAPER_STORAGE_KEY = STORAGE_KEY;

const HEX = /^#[0-9a-f]{6}$/;

export function parseHex(color: string): [number, number, number] | null {
  const value = color.trim().toLowerCase();
  if (!HEX.test(value)) return null;
  return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
}

/** WCAG relative luminance of an sRGB colour given as 0-255 channels. */
export function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The darkest background luminance that still gives every light text colour 4.5:1. */
export const MAX_BACKGROUND_LUMINANCE = Math.min(
  ...LIGHT_TEXT_COLORS.map((text) => {
    const lum = luminance(parseHex(text)!);
    return (lum + 0.05) / MIN_CONTRAST - 0.05;
  }),
);

/**
 * The least dimming (a black layer's opacity, 0 to 0.9) that makes a background whose brightest part has this colour dark
 * enough for the light text. Zero when it already is.
 */
export function minimumDim(peak: [number, number, number]): number {
  if (luminance(peak) <= MAX_BACKGROUND_LUMINANCE) return 0;
  let low = 0;
  let high = MAX_DIM;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    const dimmed = peak.map((c) => c * (1 - mid)) as [number, number, number];
    if (luminance(dimmed) <= MAX_BACKGROUND_LUMINANCE) high = mid;
    else low = mid;
  }
  // Rounded up to a whole percent, so the check holds after rounding.
  return Math.min(MAX_DIM, Math.ceil(high * 100) / 100);
}

/** A grey with this luminance, as the stand-in for the brightest part of a picture. */
export function greyForLuminance(lum: number): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, lum));
  const v = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
  const c = Math.round(Math.min(1, Math.max(0, v)) * 255);
  return [c, c, c];
}

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}

/** What the choice looks like at its brightest, or null for no background. */
export function peakOf(choice: WallpaperChoice): [number, number, number] | null {
  if (choice.kind === 'preset') {
    const preset = presetById(choice.id);
    return preset ? parseHex(preset.peak) : null;
  }
  if (choice.kind === 'color') return parseHex(choice.color);
  if (choice.kind === 'image') return greyForLuminance(choice.luminance);
  return null;
}

/** The dimming really applied: the player's choice, but never less than text readability needs. */
export function effectiveDim(setting: WallpaperSetting): number {
  const peak = peakOf(setting.choice);
  if (!peak) return 0;
  return Math.min(MAX_DIM, Math.max(minimumDim(peak), setting.dim));
}

/** Keeps what is valid and drops the rest (old, edited or broken data). */
export function normalizeWallpaper(raw: unknown): WallpaperSetting {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const c = typeof source.c === 'object' && source.c !== null ? (source.c as Record<string, unknown>) : {};
  let choice: WallpaperChoice = { kind: 'none' };
  if (c.kind === 'preset' && typeof c.id === 'string' && presetById(c.id)) choice = { kind: 'preset', id: c.id };
  else if (c.kind === 'color' && typeof c.color === 'string' && parseHex(c.color)) choice = { kind: 'color', color: c.color.trim().toLowerCase() };
  else if (c.kind === 'image' && typeof c.luminance === 'number' && Number.isFinite(c.luminance)) choice = { kind: 'image', luminance: Math.min(1, Math.max(0, c.luminance)) };
  const dim = typeof source.dim === 'number' && Number.isFinite(source.dim) ? Math.min(MAX_DIM, Math.max(0, source.dim)) : 0;
  return { choice, dim: choice.kind === 'none' ? 0 : dim };
}

export const isDefaultWallpaper = (setting: WallpaperSetting) => setting.choice.kind === 'none';

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readWallpaper(storage: Pick<Storage, 'getItem'> | null = safeStorage()): WallpaperSetting {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    return text ? normalizeWallpaper(JSON.parse(text)) : { ...DEFAULT_WALLPAPER };
  } catch {
    return { ...DEFAULT_WALLPAPER };
  }
}

/** Saves the choice, or forgets it when there is none. Returns false when the browser refused. */
export function writeWallpaper(setting: WallpaperSetting, storage: Pick<Storage, 'setItem' | 'removeItem'> | null = safeStorage()): boolean {
  try {
    if (!storage) return false;
    if (isDefaultWallpaper(setting)) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify({ c: setting.choice, dim: setting.dim }));
    return true;
  } catch {
    return false;
  }
}

/** The CSS background for a preset or colour (a picture is drawn by the layer itself). */
export function backgroundCss(choice: WallpaperChoice): string | null {
  if (choice.kind === 'preset') return presetById(choice.id)?.css ?? null;
  if (choice.kind === 'color') return parseHex(choice.color) ? choice.color : null;
  return null;
}
