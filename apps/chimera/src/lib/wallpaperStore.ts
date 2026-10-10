/**
 * Where the background picture is kept: this browser's own database (IndexedDB). It is never sent anywhere. One picture per
 * browser. Every call reports a failure (a private window, a full disk, a browser that refuses) instead of throwing.
 */

const DB_NAME = 'chimera-local';
const STORE = 'wallpaper';
const KEY = 'chat';

function openAt(version?: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('unavailable'));
      return;
    }
    const request = version === undefined ? indexedDB.open(DB_NAME) : indexedDB.open(DB_NAME, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('failed'));
    request.onblocked = () => reject(new Error('blocked'));
  });
}

/** Opens the database with its one store. If the database exists without the store (made by something else, or an interrupted first run), the store is added. */
async function open(): Promise<IDBDatabase> {
  // No version asked for: a database that already exists (at any version) is opened as it is, a new one is made with its store.
  const db = await openAt();
  if (db.objectStoreNames.contains(STORE)) return db;
  const next = db.version + 1;
  db.close();
  return openAt(next);
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error('failed'));
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error ?? new Error('aborted'));
        };
      }),
  );
}

/** Keeps the picture. Resolves true when it is stored, false when the browser would not keep it. */
export async function saveWallpaperBlob(blob: Blob): Promise<boolean> {
  try {
    await run('readwrite', (store) => store.put(blob, KEY));
    return true;
  } catch {
    return false;
  }
}

/** The stored picture, or null when there is none or it cannot be read. */
export async function loadWallpaperBlob(): Promise<Blob | null> {
  try {
    const value = await run('readonly', (store) => store.get(KEY) as IDBRequest<unknown>);
    return value instanceof Blob ? value : null;
  } catch {
    return null;
  }
}

export async function removeWallpaperBlob(): Promise<void> {
  try {
    await run('readwrite', (store) => store.delete(KEY));
  } catch {
    // Nothing to remove, or it cannot be reached: the setting is cleared either way.
  }
}
