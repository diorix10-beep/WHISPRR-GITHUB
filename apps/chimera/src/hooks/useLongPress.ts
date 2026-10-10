import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

export interface PressPoint {
  x: number;
  y: number;
}

/**
 * Long press on touch, right click on a mouse. A finger that moves (a scroll) or lifts early cancels the press, and the
 * browser's own long-press menu is replaced by ours. Safari on iPhone never sends a `contextmenu` event for a long
 * press, so the timer is what opens it there; Android and desktop browsers send one, which opens the same menu.
 */
export function useLongPress(onOpen: (point: PressPoint) => void, { delay = 450, tolerance = 10 } = {}) {
  const timer = useRef<number | null>(null);
  const origin = useRef<PressPoint | null>(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  };
  useEffect(() => cancel, []);

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.pointerType === 'mouse') return;
      cancel();
      const point = { x: event.clientX, y: event.clientY };
      origin.current = point;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        openRef.current(point);
        try {
          navigator.vibrate?.(8);
        } catch {
          // Not every browser can vibrate.
        }
      }, delay);
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const from = origin.current;
      if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > tolerance) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu(event: MouseEvent<HTMLElement>) {
      event.preventDefault();
      cancel();
      openRef.current({ x: event.clientX, y: event.clientY });
    },
  };
}
