/**
 * The two distinctions a memory carries besides its words: how sure the story is about it, and who knows it.
 * Pure (no network, no database): the app uses it to label and edit memories, and the server uses it to write the memory
 * block of the prompt and to read what the story suggests.
 */

export const CERTAINTIES = [
  { id: 'canon', label: 'Confirmed', hint: 'True in the story. The character treats it as fact.' },
  { id: 'temporary', label: 'Temporary', hint: 'True for now but expected to change: an injury, a journey, a plan. This scene only.' },
  { id: 'assumption', label: 'Assumption', hint: 'A belief, rumour or suspicion. Characters may be wrong about it. This scene only.' },
] as const;

export type MemoryCertainty = (typeof CERTAINTIES)[number]['id'];

export const KNOWN_BY = [
  { id: 'character', label: 'The character knows', hint: 'The character may act on it.' },
  { id: 'player', label: 'Only me', hint: 'A note for you. The character is never told, and it is not sent to the AI.' },
] as const;

export type KnownBy = (typeof KNOWN_BY)[number]['id'];

export const normalizeCertainty = (value: unknown): MemoryCertainty => (value === 'temporary' || value === 'assumption' ? value : 'canon');
export const normalizeKnownBy = (value: unknown): KnownBy => (value === 'player' ? 'player' : 'character');

export const certaintyLabel = (value: unknown): string => CERTAINTIES.find((c) => c.id === normalizeCertainty(value))?.label ?? 'Confirmed';

/** Only confirmed memories can follow the character into every scene (the database enforces the same rule). */
export const canBeEverywhere = (certainty: MemoryCertainty): boolean => certainty === 'canon';
