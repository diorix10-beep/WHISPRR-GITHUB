import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const root = new URL('../../../', import.meta.url);
const ME = '00000000-0000-4000-8000-0000000000a1';
const OTHER = '00000000-0000-4000-8000-0000000000b1';
const LEASE = '00000000-0000-4000-8000-0000000000f1';
const LEASE2 = '00000000-0000-4000-8000-0000000000f2';
const REQ = '00000000-0000-4000-8000-000000000101';
const REQ2 = '00000000-0000-4000-8000-000000000102';

async function billingDatabase(balance = 100) {
  const db = new PGlite();
  // Only what the billing functions touch, shaped like production (same constraints on the wallet and ledger).
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    CREATE SCHEMA auth; CREATE SCHEMA chimera_private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, public, chimera_private TO anon, authenticated, service_role;
    CREATE TABLE public.shards_wallets (user_id uuid PRIMARY KEY, available_balance bigint NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
      lifetime_earned bigint NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0), lifetime_spent bigint NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
      updated_at timestamptz DEFAULT now());
    CREATE TABLE public.shards_ledger (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), wallet_user_id uuid NOT NULL REFERENCES public.shards_wallets(user_id),
      amount bigint NOT NULL CHECK (amount <> 0), entry_type text NOT NULL CHECK (entry_type IN ('welcome_credit','purchase_credit','creative_spend','creator_tip_sent','creator_tip_received','refund','manual_adjustment','roleplay_reward')),
      status text NOT NULL DEFAULT 'posted', description text, reference_type text, reference_id uuid, created_at timestamptz DEFAULT now());
    CREATE TABLE chimera_private.ai_requests (id uuid PRIMARY KEY, user_id uuid NOT NULL, operation text NOT NULL, state text NOT NULL,
      lease uuid NOT NULL, expires_at timestamptz NOT NULL);
    ALTER TABLE public.shards_wallets ENABLE ROW LEVEL SECURITY; ALTER TABLE public.shards_ledger ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_wallet ON public.shards_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY own_ledger ON public.shards_ledger FOR SELECT TO authenticated USING (auth.uid() = wallet_user_id);
    GRANT ALL ON public.shards_wallets, public.shards_ledger TO anon, authenticated;
    INSERT INTO public.shards_wallets (user_id, available_balance) VALUES ('${ME}', ${balance}), ('${OTHER}', 5);
    INSERT INTO chimera_private.ai_requests VALUES
      ('${REQ}', '${ME}', 'chat', 'running', '${LEASE}', now() + interval '2 minutes'),
      ('${REQ2}', '${ME}', 'chat', 'running', '${LEASE2}', now() + interval '2 minutes');
  `);
  await db.exec(await readFile(new URL('supabase/migrations/20261009040000_chimera_reply_billing.sql', root), 'utf8'));
  const as = async (role, uid, sql, params) => {
    await db.exec(`SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
    try {
      return await db.query(sql, params);
    } finally {
      await db.exec('RESET ROLE');
    }
  };
  const charge = (request = REQ, lease = LEASE, amount = 10) =>
    as('service_role', null, 'SELECT public.charge_chimera_reply($1, $2, $3, $4) AS balance', [request, lease, amount, 'AURELIA']);
  const refund = async (request = REQ, lease = LEASE) =>
    (await as('service_role', null, 'SELECT public.refund_chimera_reply($1, $2) AS refunded', [request, lease])).rows[0].refunded;
  const wallet = async (user = ME) => (await db.query('SELECT available_balance::int AS b, lifetime_spent::int AS s FROM public.shards_wallets WHERE user_id = $1', [user])).rows[0];
  const ledger = async () => (await db.query('SELECT entry_type, amount::int AS amount, reference_type FROM public.shards_ledger ORDER BY created_at, entry_type')).rows;
  return { db, as, charge, refund, wallet, ledger };
}

test('charging a reply takes the price once, writes a ledger line, and a repeat of the same request takes nothing more', async () => {
  const { db, charge, wallet, ledger } = await billingDatabase();
  try {
    assert.equal(Number((await charge()).rows[0].balance), 90);
    assert.deepEqual(await wallet(), { b: 90, s: 10 });
    assert.equal(Number((await charge()).rows[0].balance), 90, 'the same request is not charged twice');
    assert.deepEqual(await wallet(), { b: 90, s: 10 });
    assert.deepEqual(await ledger(), [{ entry_type: 'creative_spend', amount: -10, reference_type: 'chat_reply' }]);
  } finally { await db.close(); }
});

test('not enough SHARDS: refused with the CH402 code and nothing is taken', async () => {
  const { db, charge, wallet, ledger } = await billingDatabase(9);
  try {
    await assert.rejects(charge(), (error) => error.code === 'CH402' && /insufficient_shards/.test(error.message));
    assert.deepEqual(await wallet(), { b: 9, s: 0 });
    assert.deepEqual(await ledger(), []);
    // Exactly enough is enough.
    const exact = await billingDatabase(10);
    try {
      assert.equal(Number((await exact.charge()).rows[0].balance), 0);
    } finally { await exact.db.close(); }
  } finally { await db.close(); }
});

test('a failed reply is refunded once, and a retry of the same request is charged again', async () => {
  const { db, charge, refund, wallet, ledger } = await billingDatabase();
  try {
    await charge();
    assert.equal(await refund(), true);
    assert.deepEqual(await wallet(), { b: 100, s: 0 });
    assert.equal(await refund(), false, 'a second refund gives nothing back');
    assert.deepEqual(await wallet(), { b: 100, s: 0 });

    await charge();
    assert.deepEqual(await wallet(), { b: 90, s: 10 }, 'the retry pays again');
    assert.deepEqual((await ledger()).map((row) => row.amount), [-10, 10, -10]);
  } finally { await db.close(); }
});

test('nothing is refunded for a reply that was delivered, or to a stale holder of the request', async () => {
  const { db, charge, refund, wallet } = await billingDatabase();
  try {
    await charge();
    assert.equal(await refund(REQ, LEASE2), false, 'a different lease cannot refund this request');
    assert.deepEqual(await wallet(), { b: 90, s: 10 });

    await db.exec(`UPDATE chimera_private.ai_requests SET state = 'completed' WHERE id = '${REQ}'`);
    assert.equal(await refund(), false, 'the reply exists, so the charge stays');
    assert.deepEqual(await wallet(), { b: 90, s: 10 });
  } finally { await db.close(); }
});

test('charges left behind by a stopped server are returned the next time the member is charged', async () => {
  const { db, charge, wallet, ledger } = await billingDatabase();
  try {
    await charge(REQ, LEASE, 10);
    // The server stopped: the request ran out of time without a reply and without a refund.
    await db.exec(`UPDATE chimera_private.ai_requests SET expires_at = now() - interval '1 minute' WHERE id = '${REQ}'`);
    await charge(REQ2, LEASE2, 5);
    assert.deepEqual(await wallet(), { b: 95, s: 5 }, 'the first 10 came back, the new 5 was taken');
    assert.deepEqual((await ledger()).map((row) => row.entry_type).sort(), ['creative_spend', 'creative_spend', 'refund']);
  } finally { await db.close(); }
});

test('a reply still being written is never swept, and a failed request is', async () => {
  const { db, charge, wallet } = await billingDatabase();
  try {
    await charge(REQ, LEASE, 10);
    await charge(REQ2, LEASE2, 5);
    assert.deepEqual(await wallet(), { b: 85, s: 15 }, 'the live request keeps its charge');

    await db.exec(`UPDATE chimera_private.ai_requests SET state = 'failed' WHERE id = '${REQ}'`);
    const third = '00000000-0000-4000-8000-000000000103';
    await db.exec(`INSERT INTO chimera_private.ai_requests VALUES ('${third}', '${ME}', 'chat', 'running', '${LEASE}', now() + interval '2 minutes')`);
    await charge(third, LEASE, 1);
    assert.deepEqual(await wallet(), { b: 94, s: 6 }, 'the failed request was returned, then 1 was taken');
  } finally { await db.close(); }
});

test('only a live chat reservation with the right lease can be charged', async () => {
  const { db, charge, wallet } = await billingDatabase();
  try {
    await assert.rejects(charge(REQ, LEASE2), /Invalid chat reservation/);
    await assert.rejects(charge('00000000-0000-4000-8000-0000000000ff'), /Invalid chat reservation/);
    await db.exec(`UPDATE chimera_private.ai_requests SET operation = 'turning_point' WHERE id = '${REQ}'`);
    await assert.rejects(charge(), /Invalid chat reservation/);
    await db.exec(`UPDATE chimera_private.ai_requests SET operation = 'chat', expires_at = now() - interval '1 second' WHERE id = '${REQ}'`);
    await assert.rejects(charge(), /Invalid chat reservation/);
    await assert.rejects(charge(REQ2, LEASE2, 0), /Invalid reply price/);
    await assert.rejects(charge(REQ2, LEASE2, -5), /Invalid reply price/);
    await assert.rejects(charge(REQ2, LEASE2, 10001), /Invalid reply price/);
    assert.deepEqual(await wallet(), { b: 100, s: 0 });
  } finally { await db.close(); }
});

test('members cannot charge, refund or edit SHARDS themselves', async () => {
  const { db, as, charge, wallet } = await billingDatabase();
  try {
    for (const role of ['authenticated', 'anon']) {
      await assert.rejects(as(role, ME, 'SELECT public.charge_chimera_reply($1, $2, 1, $3)', [REQ, LEASE, 'x']), /permission denied/, `${role} cannot charge`);
      await assert.rejects(as(role, ME, 'SELECT public.refund_chimera_reply($1, $2)', [REQ, LEASE]), /permission denied/, `${role} cannot refund`);
      await assert.rejects(as(role, ME, 'SELECT chimera_private.refund_charge($1, $2)', [REQ, LEASE]), /permission denied/);
      await assert.rejects(as(role, ME, 'SELECT * FROM chimera_private.shards_charges'), /permission denied/, `${role} cannot read charges`);
    }
    // Row-level security leaves a member no row to change.
    await as('authenticated', ME, 'UPDATE public.shards_wallets SET available_balance = 999999');
    await as('authenticated', ME, `INSERT INTO public.shards_ledger (wallet_user_id, amount, entry_type) VALUES ('${ME}', 1, 'refund')`).catch(() => undefined);
    assert.deepEqual(await wallet(), { b: 100, s: 0 });
    // They can read only their own balance.
    const seen = await as('authenticated', ME, 'SELECT user_id FROM public.shards_wallets');
    assert.deepEqual(seen.rows.map((row) => row.user_id), [ME]);
    await charge();
    assert.deepEqual(await wallet(), { b: 90, s: 10 });
  } finally { await db.close(); }
});
