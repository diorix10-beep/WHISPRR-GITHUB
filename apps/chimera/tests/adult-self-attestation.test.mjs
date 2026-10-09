import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { database, identity, ids, user, owner, sfw, mature, nsfw } from './fixtures/characterAccessDatabase.mjs';

const status = async (db, id = user) =>
  (await db.query('SELECT age_verification_status AS s, adult_content_enabled AS on_, age_verified_at, age_verification_provider, age_verification_reference, adult_attested_at, adult_attestation_version FROM chimera_user_preferences WHERE user_id = $1', [id])).rows[0];
const attest = (db) => db.query('SELECT public.attest_my_adult_status() AS s');
const access = async (db) => (await db.query('SELECT public.get_my_adult_content_access() AS allowed')).rows[0].allowed;

test('General is open to everyone; Mature stays closed until the member confirms 18+ and turns it on', async () => {
  const db = await database();
  try {
    await identity(db, 'authenticated', user);
    assert.deepEqual(await ids(db), [sfw], 'an account with no confirmation sees General only');
    assert.equal(await access(db), false);

    assert.equal((await attest(db)).rows[0].s, 'self_attested_adult');
    assert.equal(await access(db), false, 'confirming 18+ alone opens nothing: the opt-in is a separate step');
    assert.deepEqual(await ids(db), [sfw]);

    await db.query("UPDATE chimera_user_preferences SET adult_content_enabled = true WHERE user_id = $1", [user]);
    assert.equal(await access(db), true);
    assert.deepEqual(await ids(db), [sfw, mature, nsfw]);

    await db.query("UPDATE chimera_user_preferences SET adult_content_enabled = false WHERE user_id = $1", [user]);
    assert.deepEqual(await ids(db), [sfw], 'switching it off is immediate');
  } finally { await db.close(); }
});

test('an attestation is never recorded as a verification, and leaves the provider columns for Yoti empty', async () => {
  const db = await database();
  try {
    await identity(db, 'authenticated', user);
    await attest(db);
    const row = await status(db);
    assert.equal(row.s, 'self_attested_adult');
    assert.notEqual(row.s, 'verified_adult');
    assert.equal(row.age_verified_at, null);
    assert.equal(row.age_verification_provider, null);
    assert.equal(row.age_verification_reference, null);
    assert.ok(row.adult_attested_at, 'the time of the declaration is kept');
    assert.equal(row.adult_attestation_version, 'adult-attestation-1');
  } finally { await db.close(); }
});

test('members cannot write the status or the attestation columns themselves, or switch adult content on without confirming', async () => {
  const db = await database();
  try {
    await identity(db, 'authenticated', user);
    await assert.rejects(db.query("INSERT INTO chimera_user_preferences(user_id, age_verification_status) VALUES($1, 'self_attested_adult')", [user]), /only be recorded/);
    await assert.rejects(db.query("INSERT INTO chimera_user_preferences(user_id, adult_attested_at) VALUES($1, now())", [user]), /only be recorded/);
    await assert.rejects(db.query("INSERT INTO chimera_user_preferences(user_id, adult_content_enabled) VALUES($1, true)", [user]), /Confirm that you are 18/);
    await db.query('INSERT INTO chimera_user_preferences(user_id) VALUES($1)', [user]);
    await assert.rejects(db.query("UPDATE chimera_user_preferences SET age_verification_status = 'self_attested_adult' WHERE user_id = $1", [user]), /only be recorded/);
    await assert.rejects(db.query("UPDATE chimera_user_preferences SET age_verification_status = 'verified_adult' WHERE user_id = $1", [user]), /only be recorded/);
    await assert.rejects(db.query("UPDATE chimera_user_preferences SET adult_attested_at = now() WHERE user_id = $1", [user]), /only be recorded/);
    await assert.rejects(db.query("UPDATE chimera_user_preferences SET adult_content_enabled = true WHERE user_id = $1", [user]), /Confirm that you are 18/);
    assert.equal((await status(db)).s, 'unverified');
    // A signed-out request cannot confirm anything, and the service-role-only function stays closed.
    await identity(db, 'anon');
    await assert.rejects(attest(db), /permission denied/);
    await identity(db, 'authenticated', user);
    await assert.rejects(db.query("SELECT public.set_age_verification($1, 'self_attested_adult')", [user]), /permission denied/);
  } finally { await db.close(); }
});

test('confirming again changes nothing, and a verified account is never downgraded or relabelled', async () => {
  const db = await database();
  try {
    await identity(db, 'authenticated', user);
    await attest(db);
    const first = await status(db);
    await attest(db);
    assert.deepEqual(await status(db), first, 'the first declaration is kept as it was');

    await db.exec(`RESET ROLE; SELECT public.set_age_verification('${user}', 'verified_adult', 'yoti', 'ref-1');`);
    await identity(db, 'authenticated', user);
    assert.equal((await attest(db)).rows[0].s, 'verified_adult');
    assert.equal((await db.query('SELECT public.withdraw_my_adult_attestation() AS done')).rows[0].done, false, 'a verification is not something a member withdraws here');
    const row = await status(db);
    assert.deepEqual([row.s, row.age_verification_provider, row.age_verification_reference], ['verified_adult', 'yoti', 'ref-1']);
  } finally { await db.close(); }
});

test('withdrawing the confirmation closes Mature again at once and switches adult content off', async () => {
  const db = await database();
  try {
    await identity(db, 'authenticated', user);
    await attest(db);
    await db.query("UPDATE chimera_user_preferences SET adult_content_enabled = true, adult_eligibility_confirmed_at = now() WHERE user_id = $1", [user]);
    assert.deepEqual(await ids(db), [sfw, mature, nsfw]);

    assert.equal((await db.query('SELECT public.withdraw_my_adult_attestation() AS done')).rows[0].done, true);
    assert.deepEqual(await ids(db), [sfw]);
    assert.equal(await access(db), false);
    const row = await status(db);
    assert.deepEqual([row.s, row.on_, row.adult_attested_at, row.adult_attestation_version], ['unverified', false, null, null]);
    assert.equal((await db.query('SELECT public.withdraw_my_adult_attestation() AS done')).rows[0].done, false, 'nothing left to withdraw');
  } finally { await db.close(); }
});

test('Yoti can still decide: marking a self-attested account unverified closes Mature', async () => {
  const db = await database();
  try {
    await identity(db, 'authenticated', user);
    await attest(db);
    await db.query("UPDATE chimera_user_preferences SET adult_content_enabled = true WHERE user_id = $1", [user]);
    assert.equal(await access(db), true);
    await db.exec(`RESET ROLE; SELECT public.set_age_verification('${user}', 'unverified');`);
    await identity(db, 'authenticated', user);
    assert.equal(await access(db), false);
    assert.deepEqual(await ids(db), [sfw]);
    await assert.rejects(db.query("SELECT public.set_age_verification($1, 'anything')", [user]), /permission denied/);
    await db.exec('RESET ROLE');
    await assert.rejects(db.query("SELECT public.set_age_verification($1, 'anything')", [user]), /Unknown age verification status/);
  } finally { await db.close(); }
});

test('only an eligible member with adult content on can give a character a Mature rating; everything that exists is left alone', async () => {
  const db = await database();
  // The character is saved by a SECURITY DEFINER function that runs as the database owner for the signed-in member:
  // same database role as here, with the member's identity in the request.
  const asSaveFunction = async (id) => {
    await db.exec('RESET ROLE');
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [id]);
  };
  const fresh = (id, rating) => db.query(
    "INSERT INTO ai_characters(id, user_id, creator_id, visibility, content_rating) VALUES($1, $1, $2, 'private', $3)", [id, user, rating]);
  const rate = (id, rating) => db.query('UPDATE ai_characters SET content_rating = $2 WHERE id = $1', [id, rating]);
  const rating = async (id) => (await db.query('SELECT content_rating AS r FROM ai_characters WHERE id = $1', [id])).rows[0].r;
  const n = (i) => `00000000-0000-4000-8000-${String(900 + i).padStart(12, '0')}`;
  try {
    await asSaveFunction(user);
    await fresh(n(1), 'SFW');
    await assert.rejects(fresh(n(2), 'Mature'), /Mature characters need/);
    await assert.rejects(fresh(n(3), 'NSFW'), /Mature characters need/);
    await assert.rejects(rate(n(1), 'Mature'), /Mature characters need/);
    assert.equal(await rating(n(1)), 'SFW');

    await identity(db, 'authenticated', user);
    await attest(db);
    await asSaveFunction(user);
    await assert.rejects(fresh(n(2), 'Mature'), /turned adult content on/, 'confirming is not enough, the opt-in must be on');

    await identity(db, 'authenticated', user);
    await db.query('UPDATE chimera_user_preferences SET adult_content_enabled = true WHERE user_id = $1', [user]);
    await asSaveFunction(user);
    await fresh(n(2), 'Mature');
    await rate(n(1), 'Mature');
    assert.deepEqual([await rating(n(1)), await rating(n(2))], ['Mature', 'Mature']);

    // The confirmation is withdrawn: what exists keeps its rating and can still be saved, or moved to General,
    // but no new Mature character can be made, and a General one cannot be turned into Mature.
    await identity(db, 'authenticated', user);
    await db.query('SELECT public.withdraw_my_adult_attestation()');
    await asSaveFunction(user);
    await db.query("UPDATE ai_characters SET short_description = 'edited' WHERE id = $1", [n(2)]);
    await rate(n(2), 'Mature');
    await assert.rejects(fresh(n(4), 'Mature'), /Mature characters need/);
    await rate(n(1), 'SFW');
    await assert.rejects(rate(n(1), 'Mature'), /Mature characters need/);
    assert.deepEqual([await rating(n(1)), await rating(n(2))], ['SFW', 'Mature']);

    // A request that arrives as a role without any member identity is refused; the database owner is not.
    await identity(db, 'anon');
    await assert.rejects(fresh(n(5), 'Mature'), /Mature characters need/);
    await identity(db, 'authenticated', '');
    await assert.rejects(fresh(n(5), 'NSFW'), /Mature characters need/);
    await db.exec('RESET ROLE');
    await db.query("SELECT set_config('request.jwt.claim.sub', '', false)");
    await fresh(n(5), 'Mature');
  } finally { await db.close(); }
});

test('the screens never claim a verification that did not happen, and never write the age status from the browser', async () => {
  const flags = await readFile(new URL('../src/lib/ageVerification.ts', import.meta.url), 'utf8');
  assert.match(flags, /AGE_VERIFICATION_LIVE: boolean = false/, 'no age-check provider is connected');
  assert.match(flags, /ADULT_CONFIRMATION_LIVE: boolean = true/);

  const guardian = await readFile(new URL('../src/pages/GuardianPage.tsx', import.meta.url), 'utf8');
  assert.match(guardian, /18\+ confirmed by you/, 'a declaration is labelled as one');
  assert.match(guardian, /does not check it yet/);
  assert.doesNotMatch(guardian, /upsert\(\s*\{[^}]*(age_|adult_attest)/s, 'the page never writes the age columns itself');

  // Only the two database functions set the status; nothing in the app code or API writes it.
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(tsx?|mjs)$/.test(entry.name)) files.push(path);
    }
  };
  await walk(new URL('../src/', import.meta.url));
  await walk(new URL('../api/', import.meta.url));
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.doesNotMatch(text, /set_age_verification/, `${file.pathname} must not mark anyone verified`);
    assert.doesNotMatch(text, /age_verification_status\s*:\s*['"]/, `${file.pathname} must not write the status`);
    assert.doesNotMatch(text, /adult_attested_at\s*:/, `${file.pathname} must not write the attestation time`);
  }
});
