import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('uncertain committed sends reuse identity, reject changed retries and remain isolated by user/scene', async () => {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { createPendingPlayerSends } = await server.ssrLoadModule('/src/lib/pendingPlayerSend.ts');
    const { persistPlayerMessage } = await server.ssrLoadModule('/src/lib/chat.ts');
    let nextId = 0;
    const pending = createPendingPlayerSends(() => `synthetic-${++nextId}`);
    const rows = [];
    let failConfirmation = false;
    const client = { from() { return {
      select() { return { eq(_, id) { return { async maybeSingle() {
        if (failConfirmation) { failConfirmation = false; return { data: null, error: new Error('Synthetic offline') }; }
        return { data: rows.find(row => row.id === id) ?? null, error: null };
      } }; } }; },
      async insert(row) {
        rows.push(row);
        if (rows.length === 1) { failConfirmation = true; return { error: new Error('Synthetic lost acknowledgement') }; }
        return { error: null };
      },
    }; } };
    const line = { conversation_id: 'scene-one', sender_id: 'user-one', content: 'Synthetic message' };
    const first = pending.prepare(line);
    await assert.rejects(persistPlayerMessage(client, first));
    assert.throws(() => pending.prepare({ ...line, content: 'Edited text' }), /previous send is still unconfirmed/);
    const retry = pending.prepare(line);
    assert.equal(retry.id, first.id);
    await persistPlayerMessage(client, retry);
    pending.confirm(retry);
    assert.equal(rows.length, 1);
    assert.notEqual(pending.prepare(line).id, first.id);
    const otherScene = pending.prepare({ ...line, conversation_id: 'scene-two' });
    const otherUser = pending.prepare({ ...line, sender_id: 'user-two' });
    assert.notEqual(otherScene.id, otherUser.id);
    pending.confirm(first); // A stale confirmation must not clear the next send.
    assert.equal(pending.prepare(line).id, 'synthetic-2');
  } finally { await server.close(); }
});
