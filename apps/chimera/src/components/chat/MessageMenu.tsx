import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** One line under the label, for example why an item is unavailable. */
  hint?: string;
}

export interface Anchor {
  x: number;
  y: number;
}

const CLOSE_MS = 180;
const MOBILE = '(max-width: 639px)';
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  (!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-motion'));

/**
 * A backdrop and a panel that slides up on a phone and sits next to the pointer on a wide screen. Escape, a tap outside
 * and the focus loop come from useDialogFocus, which also hands the focus back when the panel goes away. `children`
 * receives `close`, which plays the closing animation and then runs the optional callback.
 */
export function Overlay({ label, role, anchor, onClose, children }: {
  label: string;
  role: 'menu' | 'alertdialog' | 'dialog';
  anchor: Anchor | null;
  onClose: () => void;
  children: (close: (after?: () => void) => void) => ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
  const closing = useRef(false);
  const mobile = typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE).matches;

  const close = (after?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    window.setTimeout(() => {
      onClose();
      after?.();
    }, reducedMotion() ? 0 : CLOSE_MS);
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  const panel = useDialogFocus(true, () => closeRef.current());

  // Wide screens: next to the pointer, kept inside the window.
  useLayoutEffect(() => {
    if (mobile || role !== 'menu' || !anchor || !panel.current) return;
    const box = panel.current.getBoundingClientRect();
    setPlace({
      left: Math.max(8, Math.min(anchor.x, window.innerWidth - box.width - 8)),
      top: Math.max(8, Math.min(anchor.y, window.innerHeight - box.height - 8)),
    });
  }, [anchor, mobile, role, panel]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Up and down move through the items, as in any menu.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    if (next !== null) {
      event.preventDefault();
      items[next].focus();
    }
  };

  const fade = shown ? 'opacity-100' : 'opacity-0';
  // A menu sits by the pointer on a wide screen; a dialog is centred and scrolls if it is tall; on a phone both are sheets.
  const popover = role === 'menu' && !mobile;
  const panelClass = mobile
    ? `absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border border-b-0 border-chimera-gold/30 bg-chimera-panel px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl outline-none transition-transform duration-200 ease-out motion-reduce:transition-none ${shown ? 'translate-y-0' : 'translate-y-full'}`
    : popover
      ? `absolute w-72 rounded-2xl border border-chimera-gold/30 bg-chimera-panel p-1.5 shadow-2xl outline-none transition-opacity duration-150 motion-reduce:transition-none ${fade}`
      : `absolute left-1/2 top-1/2 max-h-[90vh] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-chimera-gold/30 bg-chimera-panel p-5 shadow-2xl outline-none transition-opacity duration-150 motion-reduce:transition-none ${fade}`;
  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div aria-hidden="true" onPointerDown={() => close()} className={`absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none ${popover ? '' : `bg-black/50 ${fade}`}`} />
      <div
        ref={panel}
        role={role}
        aria-label={label}
        aria-modal={role === 'menu' ? undefined : true}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={popover ? { left: place?.left ?? anchor?.x ?? 8, top: place?.top ?? anchor?.y ?? 8 } : undefined}
        className={panelClass}
      >
        {mobile && <div aria-hidden="true" className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-chimera-mute/40" />}
        {children(close)}
      </div>
    </div>,
    document.body,
  );
}

/** The actions of one message: a bottom sheet on a phone, a small menu by the pointer on a wide screen. */
export function MessageMenu({ items, anchor, onClose }: { items: MenuItem[]; anchor: Anchor | null; onClose: () => void }) {
  return (
    <Overlay label="Message actions" role="menu" anchor={anchor} onClose={onClose}>
      {(close) => (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => close(item.onSelect)}
                className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-base outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold disabled:cursor-not-allowed disabled:opacity-40 ${item.danger ? 'text-chimera-rose hover:bg-chimera-rose/10 focus:bg-chimera-rose/10' : 'text-chimera-ink hover:bg-chimera-gold/10 focus:bg-chimera-gold/10'}`}
              >
                <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{item.label}</span>
                  {item.hint && <span className="block text-xs text-chimera-mute">{item.hint}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Overlay>
  );
}

/** Asks before something that cannot be undone. */
export function ConfirmDialog({ title, body, confirmLabel, busyLabel, busy, onConfirm, onCancel, extra }: {
  title: string;
  body: string;
  /** Something to fill in before confirming, shown under the text. */
  extra?: ReactNode;
  confirmLabel: string;
  busyLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Overlay label={title} role="alertdialog" anchor={{ x: 0, y: 0 }} onClose={onCancel}>
      {(close) => (
        <div className="px-2 pb-1 pt-1">
          <h2 className="font-serif text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-chimera-mute">{body}</p>
          {extra}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => close()} disabled={busy} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 font-bold hover:bg-chimera-gold/10 disabled:opacity-50">Cancel</button>
            <button type="button" onClick={onConfirm} disabled={busy} className="min-h-[44px] rounded-full bg-chimera-rose px-5 font-bold text-white hover:brightness-110 disabled:opacity-50">{busy ? busyLabel : confirmLabel}</button>
          </div>
        </div>
      )}
    </Overlay>
  );
}
