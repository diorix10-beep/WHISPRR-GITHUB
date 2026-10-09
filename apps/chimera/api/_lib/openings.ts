/**
 * A character can open a scene in several ways (its main opening message and others). The scene's own first message
 * says which one was used; the prompt must describe that one as the tone baseline, not always the main one.
 * The rules for cleaning the list are shared with the app (src/lib/openings.ts). Nothing here talks to the database.
 */
import { cleanOpenings } from '../../src/lib/openings.js';

export { cleanOpenings };

/**
 * The opening a scene really began with: the scene's first character message when it is one of the character's openings,
 * otherwise the main opening (for example when the creator has rewritten the openings since).
 */
export function openingUsed(openings: string[], firstCharacterMessage: string | null | undefined): string {
  const first = (firstCharacterMessage ?? '').trim();
  return openings.find((opening) => opening === first) ?? openings[0] ?? '';
}
