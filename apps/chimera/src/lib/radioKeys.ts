import type { KeyboardEvent } from 'react';

/**
 * Arrow keys inside a group of `role="radio"` buttons move to the next or previous one and choose it, as people expect from radio
 * buttons. Put it on the `role="radiogroup"` element and give the chosen button `tabIndex={0}` and the others `-1`.
 */
export function radioGroupKeys(event: KeyboardEvent<HTMLElement>): void {
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
  const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
  if (!forward && !backward) return;
  const radios = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)'));
  const index = radios.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  event.preventDefault();
  const next = radios[(index + (forward ? 1 : -1) + radios.length) % radios.length];
  next.focus();
  next.click();
}
