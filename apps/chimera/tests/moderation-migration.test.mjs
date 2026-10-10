import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const root = new URL('../../../', import.meta.url);
const ME = '00000000-0000-4000-8000-0000000000a1';
const OTHER = '00000000-0000-4000-8000-0000000000a2';
const STRANGER = '00000000-0000-4000-8000-0000000000a3';
const FOUNDER = '00000000-0000-4000-8000-0000000000f1';
const CREATOR = '00000000-0000-4000-8000-0000000000c9';
const BOT = '00000000-0000-4000-8000-0000000000b1';
const CHAR = '00000000-0000-4000-8000-0000000000d1';
const SCENE = '00000000-0000-4000-8000-0000000000e1';
const HUMAN_DM = '00000000-0000-4000-8000-0000000000e2';
const msgId = (n) => `00000000-0000-4000-8000-${String(1000 + n).padStart(12, '0')}`;

const file = (name) => readFile(new URL(`supabase/migrations/${name}`, root), 'utf8');
const FEEDBACK = '20261010090000_chimera_message_feedback.sql';
const MODERATION = '20261010100000_chimera_moderation_reports.sql';

/** The parts of production these migrations touch, as they are there (reports as WHISPRR's migration made it). */
async function database({ apply = true } = {}) {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA chimera_private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    GRANT USAGE ON SCHEMA auth, public, chimera_private TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    CREATE TABLE public.profiles (user_id uuid PRIMARY KEY, role text NOT NULL DEFAULT 'user', display_name text, username text);
    CREATE TABLE public.conversations (id uuid PRIMARY KEY, name text, last_message text);
    CREATE TABLE public.conversation_participants (conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE, user_id uuid, PRIMARY KEY (conversation_id, user_id));
    CREATE TABLE public.messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
      sender_id uuid, content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
    CREATE TABLE public.ai_characters (id uuid PRIMARY KEY, user_id uuid, creator_id uuid, chat_name text, content_rating text DEFAULT 'SFW', visibility text NOT NULL DEFAULT 'private');
    CREATE TABLE public.reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      content_type text NOT NULL CHECK (content_type IN ('whisper', 'comment', 'user')),
      content_id uuid, reason text NOT NULL, details text DEFAULT '',
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
      created_at timestamptz NOT NULL DEFAULT now());
    ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
    CREATE POLICY select_own_reports ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
    CREATE POLICY insert_own_report ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
    CREATE FUNCTION chimera_private.is_conversation_member(c uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
      AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = c AND user_id = auth.uid()) $$;
    GRANT EXECUTE ON FUNCTION chimera_private.is_conversation_member(uuid) TO authenticated;

    INSERT INTO auth.users VALUES ('${ME}'), ('${OTHER}'), ('${STRANGER}'), ('${FOUNDER}'), ('${CREATOR}'), ('${BOT}');
    INSERT INTO public.profiles VALUES ('${ME}', 'user', 'Me', 'me'), ('${OTHER}', 'user', 'Other', 'other'), ('${STRANGER}', 'user', 'Stranger', 'stranger'),
      ('${FOUNDER}', 'founder', 'Founder', 'founder'), ('${CREATOR}', 'user', 'Creator', 'creator'), ('${BOT}', 'ai_character', 'Sable', 'sable');
    INSERT INTO public.ai_characters VALUES ('${CHAR}', '${BOT}', '${CREATOR}', 'Sable', 'SFW', 'public');
    INSERT INTO public.conversations VALUES ('${SCENE}', 'Harbour scene', NULL), ('${HUMAN_DM}', 'Just two people', NULL);
    INSERT INTO public.conversation_participants VALUES ('${SCENE}', '${ME}'), ('${SCENE}', '${BOT}'), ('${HUMAN_DM}', '${ME}'), ('${HUMAN_DM}', '${OTHER}');
  `);
  // Twelve messages in the scene, alternating you / the character, one minute apart; the character writes the even ones.
  for (let n = 1; n <= 12; n += 1) {
    await db.query('INSERT INTO public.messages (id, conversation_id, sender_id, content, created_at) VALUES ($1, $2, $3, $4, $5)',
      [msgId(n), SCENE, n % 2 === 0 ? BOT : ME, `line ${n}`, `2026-01-01T10:${String(n).padStart(2, '0')}:00Z`]);
  }
  await db.query('INSERT INTO public.messages (id, conversation_id, sender_id, content) VALUES ($1, $2, $3, $4)', [msgId(90), HUMAN_DM, OTHER, 'a human message']);
  if (apply) {
    await db.exec(await file(FEEDBACK));
    await db.exec(await file(MODERATION));
  }
  const as = async (role, uid, sql, params = []) => {
    await db.exec(`SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
    try { return await db.query(sql, params); } finally { await db.exec('RESET ROLE'); }
  };
  const user = (uid, sql, params) => as('authenticated', uid, sql, params);
  const report = (uid, message, reason = 'harassment_or_hate', details = '') =>
    user(uid, 'SELECT public.submit_chimera_message_report($1, $2, $3) AS r', [message, reason, details]).then((res) => res.rows[0].r);
  return { db, as, user, report };
}
const rejects = (promise, pattern) => assert.rejects(promise, pattern);

// ───────────────────────────── like / dislike ─────────────────────────────

test('feedback: like, dislike and take it back on a character reply; only the member sees their own', async () => {
  const { db, user } = await database();
  try {
    const rate = (uid, n, rating) => user(uid, 'SELECT public.set_chimera_message_feedback($1, $2::smallint) AS r', [msgId(n), rating]).then((r) => r.rows[0].r);
    assert.equal(await rate(ME, 2, 1), 1);
    assert.equal(await rate(ME, 2, -1), -1, 'changing your mind replaces it');
    assert.equal((await user(ME, 'SELECT message_id, rating FROM public.chimera_message_feedback')).rows.length, 1);
    assert.equal((await user(OTHER, 'SELECT * FROM public.chimera_message_feedback')).rows.length, 0, 'nobody else can read it');
    assert.equal(await rate(ME, 2, 0), 0);
    assert.equal((await user(ME, 'SELECT * FROM public.chimera_message_feedback')).rows.length, 0, 'taking it back removes it');
    await rejects(rate(ME, 3, 1), /only for a character/, 'your own message');
    await rejects(rate(OTHER, 2, 1), /Message unavailable/, 'not in the scene');
    await rejects(rate(ME, 2, 5), /Invalid feedback/);
    await rejects(user(null, 'SELECT public.set_chimera_message_feedback($1, 1::smallint)', [msgId(2)]), /Sign in first/);
    await db.query('UPDATE public.messages SET deleted_at = now() WHERE id = $1', [msgId(4)]);
    await rejects(rate(ME, 4, 1), /Message unavailable/, 'a deleted message');
    // The table cannot be written directly, by anyone.
    await rejects(user(ME, `INSERT INTO public.chimera_message_feedback (message_id, user_id, rating) VALUES ('${msgId(2)}', '${ME}', 1)`), /permission denied/);
    await rejects(user(ME, 'DELETE FROM public.chimera_message_feedback'), /permission denied/);
    await rejects((async () => { await db.exec("SET ROLE anon"); try { await db.query('SELECT * FROM public.chimera_message_feedback'); } finally { await db.exec('RESET ROLE'); } })(), /permission denied/);
  } finally { await db.close(); }
});

// ───────────────────────────── filing a report ─────────────────────────────

test('a member reports a character message: the database builds the snapshot itself, with limited context', async () => {
  const { db, user, report } = await database();
  try {
    const result = await report(ME, msgId(8), 'harassment_or_hate', 'It insulted me.');
    assert.equal(result.duplicate, false);
    const row = (await db.query('SELECT * FROM public.reports WHERE id = $1', [result.id])).rows[0];
    assert.deepEqual([row.reporter_id, row.reported_user_id, row.content_type, row.content_id, row.reason, row.details, row.status, row.conversation_id, row.character_id],
      [ME, CREATOR, 'chimera_message', msgId(8), 'harassment_or_hate', 'It insulted me.', 'pending', SCENE, CHAR]);
    assert.equal(row.snapshot.message.content, 'line 8');
    assert.equal(row.snapshot.message.sender, 'character');
    assert.deepEqual([row.snapshot.character.name, row.snapshot.character.content_rating, row.snapshot.scene.title], ['Sable', 'SFW', 'Harbour scene']);
    // Six before and two after, nothing more of the scene, in order.
    assert.deepEqual(row.snapshot.context.map((m) => m.content), ['line 2', 'line 3', 'line 4', 'line 5', 'line 6', 'line 7', 'line 9', 'line 10']);
    assert.deepEqual(row.snapshot.context.map((m) => m.sender), ['character', 'player', 'character', 'player', 'character', 'player', 'player', 'character']);
    assert.ok(!JSON.stringify(row.snapshot).includes('line 1"') && !JSON.stringify(row.snapshot).includes('line 11') && !JSON.stringify(row.snapshot).includes('line 12'));
    assert.deepEqual((await db.query('SELECT action, actor_id FROM public.chimera_report_audit WHERE report_id = $1', [result.id])).rows, [{ action: 'submitted', actor_id: ME }]);
    // The report does nothing to anyone by itself.
    assert.equal((await db.query('SELECT visibility FROM public.ai_characters')).rows[0].visibility, 'public');
    assert.deepEqual((await user(ME, 'SELECT id, status FROM public.reports')).rows, [{ id: result.id, status: 'pending' }], 'the reporter can read their own report');
  } finally { await db.close(); }
});

test('the snapshot keeps what was reported even if the message is edited or deleted afterwards', async () => {
  const { db, report } = await database();
  try {
    const { id } = await report(ME, msgId(6), 'violence');
    await db.query("UPDATE public.messages SET content = 'something else entirely' WHERE id = $1", [msgId(6)]);
    await db.query('UPDATE public.messages SET deleted_at = now() WHERE id = $1', [msgId(6)]);
    assert.equal((await db.query('SELECT snapshot FROM public.reports WHERE id = $1', [id])).rows[0].snapshot.message.content, 'line 6');
    // Deleting the whole scene keeps the report too (only the link to the scene is dropped).
    await db.query('DELETE FROM public.conversations WHERE id = $1', [SCENE]);
    const row = (await db.query('SELECT conversation_id, snapshot FROM public.reports WHERE id = $1', [id])).rows[0];
    assert.equal(row.conversation_id, null);
    assert.equal(row.snapshot.message.content, 'line 6');
  } finally { await db.close(); }
});

test('who and what can be reported: only a member of a character scene, only someone else\'s message, only a known reason', async () => {
  const { db, user, report } = await database();
  try {
    await rejects(report(STRANGER, msgId(4)), /Message unavailable/, 'someone who is not in the scene');
    await rejects(report(ME, msgId(3)), /cannot report your own message/);
    await rejects(report(OTHER, msgId(90)), /Message unavailable/, 'a conversation with no character in it is not a CHIMERA scene');
    await rejects(report(ME, msgId(404)), /Message unavailable/);
    await db.query('UPDATE public.messages SET deleted_at = now() WHERE id = $1', [msgId(10)]);
    await rejects(report(ME, msgId(10)), /Message unavailable/, 'a deleted message');
    await rejects(report(ME, msgId(4), 'because'), /Choose a reason/);
    await rejects(report(ME, msgId(4), null), /Choose a reason/);
    await rejects(report(ME, msgId(4), 'spam', 'x'.repeat(1001)), /explanation is too long/);
    await rejects(user(null, 'SELECT public.submit_chimera_message_report($1, $2, $3)', [msgId(4), 'spam', '']), /Sign in/);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.reports')).rows[0].n, 0, 'nothing was filed by any refused attempt');
    // The explanation is optional.
    assert.equal((await report(ME, msgId(4), 'spam')).duplicate, false);
  } finally { await db.close(); }
});

test('duplicate protection: the same member cannot report the same message twice', async () => {
  const { db, report } = await database();
  try {
    const first = await report(ME, msgId(4), 'spam');
    const again = await report(ME, msgId(4), 'violence', 'second attempt');
    assert.deepEqual([again.duplicate, again.id], [true, first.id]);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.reports')).rows[0].n, 1);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.chimera_report_audit')).rows[0].n, 1, 'and the audit log has no second entry');
    // Even after a moderator dismissed it.
    await db.query("UPDATE public.reports SET status = 'dismissed'");
    assert.equal((await report(ME, msgId(4), 'spam')).duplicate, true);
  } finally { await db.close(); }
});

test('rate limit: 10 reports an hour and 30 a day per member, then a clear "try again later"', async () => {
  const { db, report } = await database();
  try {
    // A longer scene so there are enough different messages to report.
    for (let n = 100; n < 140; n += 1) {
      await db.query('INSERT INTO public.messages (id, conversation_id, sender_id, content, created_at) VALUES ($1, $2, $3, $4, now() + ($5 || \' seconds\')::interval)', [msgId(n), SCENE, BOT, `extra ${n}`, String(n)]);
    }
    for (let n = 100; n < 110; n += 1) assert.equal((await report(ME, msgId(n), 'spam')).duplicate, false);
    await assert.rejects(report(ME, msgId(110), 'spam'), (error) => /try again later/.test(error.message) && error.hint === 'rate_limited' && error.code === '54000');
    // Spread over the day: ten an hour is fine for a while, but never more than 30 in 24 hours.
    await db.query("UPDATE public.reports SET created_at = now() - interval '3 hours'");
    for (let n = 110; n < 130; n += 1) {
      await report(ME, msgId(n), 'spam');
      await db.query("UPDATE public.reports SET created_at = now() - interval '3 hours' WHERE created_at > now() - interval '1 hour'");
    }
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.reports')).rows[0].n, 30);
    await assert.rejects(report(ME, msgId(130), 'spam'), /try again later/);
    // The limit is per member.
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.reports WHERE reporter_id = $1', [OTHER])).rows[0].n, 0);
  } finally { await db.close(); }
});

// ───────────────────────────── what the table allows ─────────────────────────────

test('the table: a message report cannot be forged, a report cannot be changed or removed by its reporter, others cannot read it', async () => {
  const { db, user, report } = await database();
  try {
    const { id } = await report(ME, msgId(4), 'spam');
    // Forged: straight into the table with a made-up snapshot, as the member.
    await rejects(user(ME, `INSERT INTO public.reports (reporter_id, content_type, content_id, reason, snapshot) VALUES ('${ME}', 'chimera_message', '${msgId(6)}', 'spam', '{"message":{"content":"fake"}}')`), /filed through submit_chimera_message_report/);
    // WHISPRR's own kind of report still works as before, and starts as pending whatever the member wrote.
    await user(ME, `INSERT INTO public.reports (reporter_id, reported_user_id, content_type, content_id, reason, status, snapshot) VALUES ('${ME}', '${OTHER}', 'user', NULL, 'spam', 'resolved', '{"x":1}')`);
    const own = (await user(ME, "SELECT status, snapshot FROM public.reports WHERE content_type = 'user'")).rows[0];
    assert.deepEqual([own.status, own.snapshot], ['pending', null]);
    // Impersonation is still impossible.
    await rejects(user(ME, `INSERT INTO public.reports (reporter_id, content_type, reason) VALUES ('${OTHER}', 'user', 'spam')`), /row-level security/);
    // No edits, no deletes: there is no policy for them, so the database finds no row to change, and the trigger refuses
    // as well should a policy ever be added by mistake.
    assert.equal((await user(ME, "UPDATE public.reports SET status = 'dismissed', details = 'rewritten' RETURNING id")).rows.length, 0);
    assert.equal((await user(ME, 'DELETE FROM public.reports RETURNING id')).rows.length, 0);
    assert.deepEqual((await db.query('SELECT status, details FROM public.reports WHERE id = $1', [id])).rows, [{ status: 'pending', details: '' }]);
    await db.exec('CREATE POLICY mistaken_update ON public.reports FOR UPDATE TO authenticated USING (true); CREATE POLICY mistaken_delete ON public.reports FOR DELETE TO authenticated USING (true);');
    await rejects(user(ME, "UPDATE public.reports SET status = 'dismissed'"), /cannot be changed or removed/);
    await rejects(user(ME, 'DELETE FROM public.reports'), /cannot be changed or removed/);
    await db.exec('DROP POLICY mistaken_update ON public.reports; DROP POLICY mistaken_delete ON public.reports;');
    // Nobody else reads it.
    assert.equal((await user(OTHER, 'SELECT * FROM public.reports')).rows.length, 0);
    assert.equal((await user(STRANGER, 'SELECT * FROM public.reports')).rows.length, 0);
    assert.equal((await user(CREATOR, 'SELECT * FROM public.reports')).rows.length, 0, 'not even the creator of the reported character');
    assert.equal((await user(ME, 'SELECT * FROM public.chimera_report_audit')).rows.length, 0, 'the audit log is for moderators');
    assert.equal((await user(ME, 'SELECT public.count_unread_chimera_reports() AS n')).rows[0].n, 0);
    assert.ok(id);
  } finally { await db.close(); }
});

// ───────────────────────────── moderators ─────────────────────────────

test('moderators: only the founder role gets in, the others are refused by the database, not by the page', async () => {
  const { db, user, report } = await database();
  try {
    const { id } = await report(ME, msgId(4), 'spam');
    for (const sql of [
      ['SELECT public.list_chimera_reports()', []],
      ['SELECT public.get_chimera_report($1)', [id]],
      ["SELECT public.update_chimera_report($1, 'resolved', 'x')", [id]],
      ["SELECT public.moderator_make_chimera_character_private($1, 'because')", [id]],
    ]) {
      for (const uid of [ME, OTHER, STRANGER, CREATOR, null]) await rejects(user(uid, sql[0], sql[1]), /Moderator access required|permission denied/, `${sql[0]} as ${uid}`);
    }
    assert.equal((await user(ME, 'SELECT public.count_unread_chimera_reports() AS n')).rows[0].n, 0, 'the counter says 0 to everybody else');
    assert.equal((await user(FOUNDER, 'SELECT public.count_unread_chimera_reports() AS n')).rows[0].n, 1);
    // Anonymous visitors cannot even call them.
    await db.exec('SET ROLE anon');
    try { await rejects(db.query('SELECT public.list_chimera_reports()'), /permission denied/); } finally { await db.exec('RESET ROLE'); }
    // The report is unchanged by all of that.
    assert.equal((await db.query('SELECT status FROM public.reports WHERE id = $1', [id])).rows[0].status, 'pending');
  } finally { await db.close(); }
});

test('moderators: the queue, the unread counter, opening a report, and what they see of the scene', async () => {
  const { db, user, report } = await database();
  try {
    const a = await report(ME, msgId(4), 'spam', 'Looks like an advert.');
    const b = await report(ME, msgId(8), 'child_safety');
    const list = (await user(FOUNDER, 'SELECT public.list_chimera_reports() AS r')).rows[0].r;
    assert.deepEqual([list.total, list.unread, list.items.length], [2, 2, 2]);
    assert.ok(list.items.every((i) => i.unread === true && i.status === 'pending' && i.character_name === 'Sable'));
    assert.deepEqual(list.items.map((i) => i.excerpt).sort(), ['line 4', 'line 8']);

    const opened = (await user(FOUNDER, 'SELECT public.get_chimera_report($1) AS r', [a.id])).rows[0].r;
    assert.deepEqual([opened.status, opened.reason, opened.details, opened.reporter.name], ['pending', 'spam', 'Looks like an advert.', 'Me']);
    assert.equal(opened.snapshot.message.content, 'line 4');
    assert.equal(opened.snapshot.context.length, 5, 'three before the fourth message and two after, no more of the scene');
    assert.equal(opened.character_visibility, 'public');
    assert.ok(opened.first_viewed_at);
    assert.deepEqual(opened.audit.map((e) => [e.action, e.actor]), [['submitted', 'Me'], ['viewed', 'Founder']]);
    // Reading it again changes nothing and logs nothing new.
    const again = (await user(FOUNDER, 'SELECT public.get_chimera_report($1) AS r', [a.id])).rows[0].r;
    assert.equal(again.audit.length, 2);
    assert.equal((await user(FOUNDER, 'SELECT public.count_unread_chimera_reports() AS n')).rows[0].n, 1, 'one is still unread');
    assert.equal((await user(FOUNDER, 'SELECT public.list_chimera_reports() AS r')).rows[0].r.unread, 1);
    assert.equal((await user(FOUNDER, "SELECT public.list_chimera_reports('pending', 1, 0) AS r")).rows[0].r.items.length, 1, 'paging');
    assert.equal((await user(FOUNDER, "SELECT public.list_chimera_reports('resolved') AS r")).rows[0].r.items.length, 0);
    await rejects(user(FOUNDER, "SELECT public.list_chimera_reports('nonsense')"), /Unknown status/);
    await rejects(user(FOUNDER, 'SELECT public.get_chimera_report($1)', [msgId(1)]), /Report not found/);
    assert.ok(b.id);
  } finally { await db.close(); }
});

test('moderators: statuses persist and every change is in the audit log with who, when and why', async () => {
  const { db, user, report } = await database();
  try {
    const { id } = await report(ME, msgId(4), 'spam');
    const update = (status, note) => user(FOUNDER, 'SELECT public.update_chimera_report($1, $2, $3) AS r', [id, status, note ?? null]).then((r) => r.rows[0].r);
    assert.deepEqual(await update('under_review', 'Looking into it.'), { id, status: 'under_review', changed: true });
    assert.deepEqual(await update('under_review'), { id, status: 'under_review', changed: false }, 'the same status with nothing to add is a no-op');
    assert.equal((await update('under_review', 'Second thoughts: keep the character as it is.')).changed, true);
    await update('escalated', 'Needs the founder.');
    await update('resolved', 'Checked: no problem.');
    await update('pending', 'Reopened after a second report.');
    await update('dismissed', 'Not a violation.');
    await rejects(update('banned'), /Unknown status/);
    await rejects(update(null), /Unknown status/);
    await rejects(update('resolved', 'x'.repeat(2001)), /note is too long/);
    assert.equal((await db.query('SELECT status FROM public.reports WHERE id = $1', [id])).rows[0].status, 'dismissed', 'it is stored, so a refresh shows the same');
    assert.equal((await user(FOUNDER, "SELECT public.list_chimera_reports('dismissed') AS r")).rows[0].r.items.length, 1);
    const log = (await db.query("SELECT action, actor_id, from_status, to_status, note FROM public.chimera_report_audit WHERE report_id = $1 AND action <> 'viewed' ORDER BY id", [id])).rows;
    assert.deepEqual(log.map((e) => [e.action, e.from_status, e.to_status, e.note]), [
      ['submitted', null, null, null],
      ['status_changed', 'pending', 'under_review', 'Looking into it.'],
      ['note_added', null, null, 'Second thoughts: keep the character as it is.'],
      ['status_changed', 'under_review', 'escalated', 'Needs the founder.'],
      ['status_changed', 'escalated', 'resolved', 'Checked: no problem.'],
      ['status_changed', 'resolved', 'pending', 'Reopened after a second report.'],
      ['status_changed', 'pending', 'dismissed', 'Not a violation.'],
    ]);
    assert.ok(log.slice(1).every((e) => e.actor_id === FOUNDER));
    // The reporter sees the status, never the moderators' notes.
    assert.deepEqual((await user(ME, 'SELECT status FROM public.reports')).rows, [{ status: 'dismissed' }]);
    const columns = (await user(ME, 'SELECT * FROM public.reports')).fields.map((f) => f.name);
    assert.ok(!columns.some((c) => /note|reviewed_by|resolution/.test(c)), columns.join(','));
  } finally { await db.close(); }
});

test('the audit log cannot be edited or erased from the app, not even by a moderator', async () => {
  const { db, user, report } = await database();
  try {
    const { id } = await report(ME, msgId(4), 'spam');
    await user(FOUNDER, "SELECT public.update_chimera_report($1, 'resolved', 'ok')", [id]);
    for (const sql of ["UPDATE public.chimera_report_audit SET note = 'rewritten'", 'DELETE FROM public.chimera_report_audit',
      `INSERT INTO public.chimera_report_audit (report_id, actor_id, action) VALUES ('${id}', '${FOUNDER}', 'viewed')`, 'TRUNCATE public.chimera_report_audit']) {
      await rejects(user(FOUNDER, sql), /permission denied|cannot be changed/, sql);
      await rejects(user(ME, sql), /permission denied|cannot be changed|row-level/, sql);
    }
    assert.equal((await user(FOUNDER, 'SELECT count(*)::int AS n FROM public.chimera_report_audit')).rows[0].n, 2, 'a moderator can read it');
    assert.equal((await user(OTHER, 'SELECT count(*)::int AS n FROM public.chimera_report_audit')).rows[0].n, 0);
  } finally { await db.close(); }
});

test('hiding a character is a separate, written-down moderator action; a report alone never does it', async () => {
  const { db, user, report } = await database();
  try {
    const { id } = await report(ME, msgId(4), 'child_safety');
    await user(FOUNDER, "SELECT public.update_chimera_report($1, 'under_review', NULL)", [id]);
    await user(FOUNDER, "SELECT public.update_chimera_report($1, 'escalated', 'x')", [id]);
    assert.equal((await db.query('SELECT visibility FROM public.ai_characters')).rows[0].visibility, 'public', 'statuses never touch the character');
    await rejects(user(FOUNDER, "SELECT public.moderator_make_chimera_character_private($1, '')", [id]), /reason/);
    await rejects(user(FOUNDER, "SELECT public.moderator_make_chimera_character_private($1, 'ab')", [id]), /reason/);
    const done = (await user(FOUNDER, "SELECT public.moderator_make_chimera_character_private($1, 'Explicit content in a General scene.') AS r", [id])).rows[0].r;
    assert.deepEqual([done.visibility, done.was], ['private', 'public']);
    assert.equal((await db.query('SELECT visibility FROM public.ai_characters')).rows[0].visibility, 'private');
    const last = (await db.query("SELECT action, from_status, to_status, note, actor_id FROM public.chimera_report_audit WHERE action = 'character_made_private'")).rows;
    assert.deepEqual(last, [{ action: 'character_made_private', from_status: 'public', to_status: 'private', note: 'Explicit content in a General scene.', actor_id: FOUNDER }]);
    // Doing it twice is harmless and still recorded.
    assert.equal((await user(FOUNDER, "SELECT public.moderator_make_chimera_character_private($1, 'Again.') AS r", [id])).rows[0].r.was, 'private');
    // A report about a message of a player has no character to hide.
    await db.query("INSERT INTO public.conversation_participants VALUES ('00000000-0000-4000-8000-0000000000e1', '" + OTHER + "')");
    const human = await report(OTHER, msgId(3), 'spam');
    await rejects(user(FOUNDER, "SELECT public.moderator_make_chimera_character_private($1, 'because')", [human.id]), /no character to hide/);
  } finally { await db.close(); }
});

// ───────────────────────────── the migrations themselves ─────────────────────────────

test('the migrations only add, widen two WHISPRR lists, and can be applied twice', async () => {
  const { db } = await database();
  try {
    await db.exec(await file(FEEDBACK));
    await db.exec(await file(MODERATION));
    const statuses = (await db.query("SELECT pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname IN ('reports_status_check', 'reports_content_type_check') ORDER BY conname")).rows.map((r) => r.d).join(' ');
    for (const old of ['whisper', 'comment', 'user', 'pending', 'reviewed', 'resolved']) assert.ok(statuses.includes(`'${old}'`), `${old} is still allowed`);
    for (const added of ['chimera_message', 'under_review', 'dismissed', 'escalated']) assert.ok(statuses.includes(`'${added}'`), `${added} is allowed`);
    // WHISPRR's existing way of reporting keeps working.
    await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${ME}', false);`);
    try { await db.query(`INSERT INTO public.reports (reporter_id, reported_user_id, content_type, reason, details) VALUES ('${ME}', '${OTHER}', 'whisper', 'spam', 'x')`); } finally { await db.exec('RESET ROLE'); }
  } finally { await db.close(); }
  for (const name of [FEEDBACK, MODERATION]) {
    const code = (await file(name)).replace(/--.*$/gm, '');
    // (The one DELETE is a member taking back their own like.)
    assert.doesNotMatch(code, /\b(DROP\s+(TABLE|COLUMN|FUNCTION|SCHEMA)|TRUNCATE|DELETE\s+FROM\s+public\.(?!chimera_message_feedback)|UPDATE\s+public\.messages\s+SET)/i, name);
    // The only DROPs are of things this same migration creates again right after (constraints, policy, triggers).
    for (const drop of code.match(/DROP\s+(CONSTRAINT|POLICY|TRIGGER)\s+IF EXISTS\s+\w+/gi) ?? []) {
      const thing = drop.split(/\s+/).pop();
      assert.match(code, new RegExp(`(ADD CONSTRAINT|CREATE POLICY|CREATE TRIGGER)\\s+${thing}\\b`), `${thing} is recreated`);
    }
  }
});

test('every function that moderators or members call is locked down: no PUBLIC or anon execute, search_path fixed', async () => {
  const { db } = await database();
  try {
    const rows = (await db.query(`SELECT p.proname, p.prosecdef, coalesce(array_to_string(p.proconfig, ','), '') AS cfg,
        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec, has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE (n.nspname = 'public' AND p.proname IN ('set_chimera_message_feedback', 'submit_chimera_message_report', 'count_unread_chimera_reports',
        'list_chimera_reports', 'get_chimera_report', 'update_chimera_report', 'moderator_make_chimera_character_private'))`)).rows;
    assert.equal(rows.length, 7);
    for (const r of rows) {
      assert.equal(r.prosecdef, true, r.proname);
      assert.match(r.cfg, /search_path=""/, `${r.proname} has a fixed search_path`);
      assert.equal(r.anon_exec, false, `${r.proname} is not callable by anon`);
      assert.equal(r.auth_exec, true, r.proname);
    }
  } finally { await db.close(); }
});
