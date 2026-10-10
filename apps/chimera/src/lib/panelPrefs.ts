/**
 * Whether the management panel stays open next to the chat on a computer. Kept in this browser only (nothing private,
 * and it must never block the screen): a browser that refuses storage simply starts with the panel closed.
 */
const KEY = 'chimera.chat.panel.open';

export function readPanelOpen(storage: Pick<Storage, 'getItem'> | null = safeStorage()): boolean {
  try {
    return storage?.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function writePanelOpen(open: boolean, storage: Pick<Storage, 'setItem' | 'removeItem'> | null = safeStorage()): void {
  try {
    if (open) storage?.setItem(KEY, '1');
    else storage?.removeItem(KEY);
  } catch {
    // The choice just is not remembered.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
