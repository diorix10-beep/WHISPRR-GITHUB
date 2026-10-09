/**
 * A character can open a scene in several ways: its main opening message and up to MAX_ALTERNATE_OPENINGS others. The
 * player picks one when a scene begins. api/_lib/openings.ts holds the same rules for the server (kept in step by a test).
 */

export const MAX_ALTERNATE_OPENINGS = 10;

/** The main opening first, then the others: trimmed, without empty ones or repeats (ignoring capitals). */
export function cleanOpenings(greeting: unknown, alternates: unknown): string[] {
  const list = [greeting, ...(Array.isArray(alternates) ? alternates : [])];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const value = typeof item === 'string' ? item.trim() : '';
    if (value && !seen.has(value.toLowerCase())) {
      seen.add(value.toLowerCase());
      out.push(value);
    }
  }
  return out;
}

/** A random opening, for "surprise me". `roll` is a number from 0 up to (not including) 1. */
export function surpriseOpening(openings: string[], roll: number): string {
  return openings[Math.min(openings.length - 1, Math.floor(Math.max(0, roll) * openings.length))] ?? '';
}
