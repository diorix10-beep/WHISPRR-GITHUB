// ============================================================
// ORACLE VERITY — KV SYNCHRONIZATION 
// Syncs local Zustand state with Vercel KV globally
// ============================================================

export async function fetchGlobalState(key: string): Promise<any> {
  try {
    const res = await fetch(`/api/kv-sync?key=${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.result) return null;
    
    // Vercel KV REST API returns JSON strings as strings, so we may need to parse twice
    let parsed = data.result;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch (e) {}
    }
    return parsed;
  } catch (err) {
    console.error(`Failed to fetch global state for ${key}`, err);
    return null;
  }
}

export async function pushGlobalState(key: string, value: any): Promise<void> {
  try {
    await fetch(`/api/kv-sync?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify(value) })
    });
  } catch (err) {
    console.error(`Failed to push global state for ${key}`, err);
  }
}
