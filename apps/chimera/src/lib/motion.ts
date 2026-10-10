/**
 * The player's wish for less movement (Look tab > Movement). It is written on the page root so the whole app follows it,
 * not only the chat; the stylesheet reads it (see `[data-motion]` in index.css). 'device' removes it, which leaves only
 * what the device itself asks for (`prefers-reduced-motion`).
 */
export function applyMotion(motion: string): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (motion === 'reduced' || motion === 'calm') root.setAttribute('data-motion', motion);
  else root.removeAttribute('data-motion');
}

/** True when movement should be reduced, by the player's choice or by the device's setting. */
export function wantsLessMotion(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.hasAttribute('data-motion') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** The `behavior` to give a scrolling call: smooth only when the player and the device both allow movement. */
export const scrollBehavior = (): ScrollBehavior => (wantsLessMotion() ? 'auto' : 'smooth');
