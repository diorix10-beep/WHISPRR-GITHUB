import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { database, identity, verify, user, scene, mature, sfw } from './fixtures/characterAccessDatabase.mjs';
const root = new URL('../../../', import.meta.url);
const migration = new URL('supabase/migrations/20261008162011_chimera_turning_point_access.sql', root);

async function turningPointDatabase() {
  const db = await database();
  try {
    const legacy = await readFile(new URL('supabase/migrations/20260814160206_add_roleplay_turning_points.sql', root), 'utf8');
    // Actual table/read/create contracts; skip the unrelated wallet index/claim functions.
    await db.exec(legacy.slice(legacy.indexOf('CREATE TABLE IF NOT EXISTS public.roleplay_turning_points'), legacy.indexOf('CREATE UNIQUE INDEX IF NOT EXISTS shards_')) +
      legacy.slice(legacy.indexOf('ALTER TABLE public.roleplay_turning_points'), legacy.indexOf('CREATE OR REPLACE FUNCTION public.claim_my_roleplay_turning_point')));
    const protection = await readFile(new URL('supabase/migrations/20260930150040_chimera_phase1_request_protection.sql', root), 'utf8');
    const start = protection.indexOf('CREATE OR REPLACE FUNCTION public.complete_guarded_chimera_turning_point');
    await db.exec(protection.slice(start, protection.indexOf('REVOKE ALL ON FUNCTION public.reserve_chimera_ai_request', start)));
    await db.exec(`INSERT INTO profiles VALUES ('${user}','Synthetic user','member');
      UPDATE conversations SET type='dm' WHERE id='${scene}';
      INSERT INTO messages(conversation_id,sender_id,content) SELECT '${scene}','${user}','synthetic line' FROM generate_series(1,7);
      GRANT EXECUTE ON FUNCTION public.complete_guarded_chimera_turning_point(uuid,uuid,uuid,text,text,jsonb) TO service_role;
      GRANT SELECT ON roleplay_turning_points TO authenticated;`);
    await db.exec(await readFile(migration, 'utf8'));
    return db;
  } catch (error) { await db.close(); throw error; }
}
const choices = JSON.stringify([{ id: 'a', label: 'First' }, { id: 'b', label: 'Second' }]);
async function reserve(db, key) {
  return (await db.query('SELECT public.reserve_chimera_ai_request($1,$2,$3,$4,$5) AS job',
    [user, 'turning_point', scene, key, 'a'.repeat(64)])).rows[0].job;
}
async function complete(db, job) {
  return (await db.query('SELECT public.complete_guarded_chimera_turning_point($1,$2,$3,$4,$5,$6) AS result',
    [job.id, job.lease, scene, 'Synthetic decision', 'Synthetic restricted excerpt', choices])).rows[0].result;
}

test('turning-point completion rejects in-flight consent and verification revocation without saving output', async () => {
  const db = await turningPointDatabase();
  try {
    for (const revoke of ['consent', 'verification']) {
      await verify(db, true);
      await identity(db, 'service_role');
      const job = await reserve(db, revoke);
      assert.equal(job.state, 'reserved');
      await db.exec('RESET ROLE');
      if (revoke === 'consent') await db.exec(`UPDATE chimera_user_preferences SET adult_content_enabled=false WHERE user_id='${user}'`);
      else await db.query('SELECT public.set_age_verification($1,$2)', [user, 'unverified']);
      await identity(db, 'service_role');
      await assert.rejects(complete(db, job), /Turning point permission changed/);
      await assert.rejects(reserve(db, revoke), /Turning point permission changed/);
      await db.exec('RESET ROLE');
      assert.equal((await db.query('SELECT count(*)::int AS n FROM roleplay_turning_points')).rows[0].n, 0);
      // Discard only the synthetic failed reservation between test cases.
      await db.exec('DELETE FROM chimera_private.ai_requests');
    }
  } finally { await db.close(); }
});

test('turning-point cache and RLS revoke access; eligible and SFW paths still work and migration preserves points', async () => {
  const db = await turningPointDatabase();
  try {
    await verify(db, true);
    await identity(db, 'service_role');
    const job = await reserve(db, 'completed');
    const result = await complete(db, job);
    assert.equal(result.turning_point.reward_shards, 10);
    assert.equal((await reserve(db, 'completed')).state, 'completed');
    await identity(db, 'authenticated', user);
    assert.equal((await db.query('SELECT * FROM roleplay_turning_points')).rows.length, 1);
    await db.exec('RESET ROLE');
    await db.exec(await readFile(migration, 'utf8'));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM roleplay_turning_points')).rows[0].n, 1);
    await db.exec(`UPDATE chimera_user_preferences SET adult_content_enabled=false WHERE user_id='${user}'`);
    await identity(db, 'service_role');
    await assert.rejects(reserve(db, 'completed'), /Turning point permission changed/);
    await assert.rejects(db.query('SELECT public.get_chimera_ai_request($1,$2)', [job.id, job.lease]), /Turning point permission changed/);
    await identity(db, 'authenticated', user);
    assert.deepEqual((await db.query('SELECT * FROM roleplay_turning_points')).rows, []);
    await assert.rejects(db.query('SELECT public.create_my_roleplay_turning_point($1,$2,$3,$4)', [scene, 'Title', 'Prompt', choices]), /Turning point permission changed/);
    await db.exec('RESET ROLE');
    // Same scene with a public SFW character is available without adult consent.
    await db.query('UPDATE ai_characters SET content_rating=$1 WHERE id=$2', ['SFW', mature]);
    await identity(db, 'authenticated', user);
    assert.equal((await db.query('SELECT * FROM roleplay_turning_points')).rows.length, 1);
    await identity(db, 'service_role');
    assert.equal((await reserve(db, 'completed')).state, 'completed');
    // A non-member must not admit/cache a request, even for SFW.
    await assert.rejects(db.query('SELECT public.reserve_chimera_ai_request($1,$2,$3,$4,$5)', [sfw, 'turning_point', scene, 'nonmember', 'a'.repeat(64)]), /Turning point permission changed/);
  } finally { await db.close(); }
});
