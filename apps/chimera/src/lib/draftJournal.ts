export interface DraftRecord<T> {
  version: 1;
  value: T;
  baseRevision?: string;
  savedAt: string;
}

export function draftKey(userId: string, kind: 'message' | 'chapter' | 'world' | 'world-canvas', ...ids: string[]) {
  return ['chimera', 'draft', 'v1', userId, kind, ...ids].join(':');
}

export function readDraft<T>(key: string, storage: Storage = localStorage): DraftRecord<T> | null {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null') as DraftRecord<T> | null;
    return value?.version === 1 && value.value !== undefined ? value : null;
  } catch { return null; }
}

export function writeDraft<T>(key: string, value: T, baseRevision?: string, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(key, JSON.stringify({ version: 1, value, baseRevision, savedAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
}

// A late save acknowledgement must not discard newer work or another tab's draft.
export function clearSavedDraft<T>(key: string, saved: T, storage: Storage = localStorage): boolean {
  try {
    const current = readDraft<T>(key, storage);
    if (current && JSON.stringify(current.value) !== JSON.stringify(saved)) return false;
    storage.removeItem(key);
    return true;
  } catch { return false; }
}

export function draftMatches<T>(record: DraftRecord<T> | null, value: T) {
  return record !== null && JSON.stringify(record.value) === JSON.stringify(value);
}
