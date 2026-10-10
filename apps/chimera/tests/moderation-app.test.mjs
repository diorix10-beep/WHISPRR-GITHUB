import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const USER = '00000000-0000-4000-8000-0000000000a1';
const OTHER = '00000000-0000-4000-8000-0000000000a2';
const REPORT = '00000000-0000-4000-8000-0000000000c1';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const migration = (name) => readFile(new URL(`../../../supabase/migrations/${name}`, import.meta.url), 'utf8');

async function server() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  return createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
}

test('the reasons and statuses in the app are exactly the ones the database accepts', async () => {
  const vite = await server();
  try {
    const { REPORT_REASONS, REPORT_STATUSES } = await vite.ssrLoadModule('/src/lib/reportReasons.ts');
    const sql = await migration('20261010100000_chimera_moderation_reports.sql');
    const reasons = sql.match(/ARRAY\[([^\]]+)\]/)[1].match(/'([a-z_]+)'/g).map((x) => x.replace(/'/g, ''));
    assert.deepEqual(REPORT_REASONS.map((r) => r.id), reasons);
    for (const status of REPORT_STATUSES) assert.ok(sql.includes(`'${status.id}'`), status.id);
    assert.equal(REPORT_STATUSES.length, 5);
    assert.deepEqual(REPORT_STATUSES.map((s) => s.id), ['pending', 'under_review', 'resolved', 'dismissed', 'escalated']);
    assert.match(sql, /char_length\(v_details\) > 1000/);
  } finally { await vite.close(); }
});

test('what the database says is turned into a message a member can act on, never raw text', async () => {
  const vite = await server();
  try {
    const { reportFailure } = await vite.ssrLoadModule('/src/lib/moderation.ts');
    assert.equal(reportFailure({ code: '54000', hint: 'rate_limited', message: 'You have sent many reports recently.' }).kind, 'rate_limited');
    assert.equal(reportFailure({ code: '42501', message: 'Message unavailable' }).kind, 'unavailable');
    assert.equal(reportFailure({ code: '22023', message: 'Choose a reason' }).kind, 'invalid');
    for (const error of [{ code: '57014', message: 'canceling statement' }, { message: 'TypeError: Failed to fetch' }, null, undefined]) {
      const failure = reportFailure(error);
      assert.equal(failure.kind, 'failed');
      assert.ok(!/canceling|TypeError|fetch/.test(failure.message), failure.message);
    }
  } finally { await vite.close(); }
});

test('reports and likes are off until the database part is applied, and the menu only offers them when on', async () => {
  const moderation = await read('src/lib/moderation.ts');
  assert.match(moderation, /FEEDBACK_LIVE: boolean = import\.meta\.env\.VITE_CHIMERA_FEEDBACK_LIVE === 'true'/);
  assert.match(moderation, /MODERATION_LIVE: boolean = import\.meta\.env\.VITE_CHIMERA_MODERATION_LIVE === 'true'/);
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /FEEDBACK_LIVE && message\.sender_id === scene\.botUserId/, 'like and dislike: only the character\'s replies');
  assert.match(page, /MODERATION_LIVE && !isMine\(message\)/, 'report: never your own message');
  assert.match(page, /submitMessageReport\(reporting\.id, reason, details\)/);
  const gate = await read('src/components/admin/AdminParts.tsx');
  assert.match(gate, /!isFounder \|\| !MODERATION_LIVE/);
  const hook = await read('src/hooks/useUnreadReports.ts');
  assert.match(hook, /MODERATION_LIVE && !!user && isFounder/, 'only moderators ask for the count');
});

test('the report dialog only says "sent" once the database saved it, keeps what was written on failure, and does not hide a duplicate', async () => {
  const dialog = await read('src/components/chat/ReportDialog.tsx');
  assert.match(dialog, /if \(outcome\.ok\) setDone\(\{ duplicate: outcome\.duplicate \}\)/);
  assert.match(dialog, /else \{\s*setProblem\(outcome\.message\)/);
  assert.match(dialog, /disabled=\{!reason \|\| busy\}/, 'a reason is required');
  assert.match(dialog, /REPORT_DETAILS_MAX/);
  assert.match(dialog, /never punishes anyone automatically/);
  const lib = await read('src/lib/moderation.ts');
  // The e-mail nudge never decides whether the report counts.
  assert.match(lib, /if \(!result\.duplicate\) void notifyAdministrators\(result\.id\)/);
  assert.match(lib, /catch \{\s*\/\/ Not being able to e-mail never matters to the member\./);
});

test('the admin pages read only through the database functions, and send nothing but a status, a note and a reason', async () => {
  const lib = await read('src/lib/moderation.ts');
  for (const fn of ['list_chimera_reports', 'get_chimera_report', 'update_chimera_report', 'moderator_make_chimera_character_private', 'count_unread_chimera_reports']) {
    assert.match(lib, new RegExp(`rpc\\('${fn}'`));
  }
  assert.doesNotMatch(lib, /from\('reports'\)|from\("reports"\)/, 'no direct reads or writes of the table from the app');
  const app = await read('src/App.tsx');
  assert.match(app, /path="\/admin\/moderation\/reports" element=\{<ModerationReportsPage \/>\}/);
  assert.match(app, /path="\/admin\/moderation\/reports\/:id"/);
  const detail = await read('src/pages/admin/ModerationReportPage.tsx');
  assert.match(detail, /Only these messages were copied into the report/);
  assert.match(detail, /Setting a status never changes it/);
});

// ───────────────────────────── the e-mail to administrators ─────────────────────────────

const SECRET = 'THE-REPORTED-WORDS-MUST-NEVER-LEAVE-THE-DASHBOARD';

test('the alert e-mail has a category, a time and a link, and never any message, explanation or name', async () => {
  const vite = await server();
  try {
    const { alertRecipients, buildReportAlert, sendReportAlert } = await vite.ssrLoadModule('/api/_lib/reportAlert.ts');
    assert.deepEqual(alertRecipients(' Admin@Example.com; second@example.org,not-an-email,admin@example.com , x@y '), ['admin@example.com', 'second@example.org']);
    assert.deepEqual(alertRecipients(undefined), []);
    assert.equal(alertRecipients(Array.from({ length: 30 }, (_, i) => `a${i}@example.com`).join(',')).length, 10);
    const mail = buildReportAlert({ id: REPORT, reason: 'child_safety', created_at: '2026-10-10T08:30:00Z', content: SECRET, details: SECRET, snapshot: SECRET }, 'https://chimera.it.com/');
    assert.equal(mail.subject, 'New CHIMERA report to review');
    assert.match(mail.text, /Category: Sexual content involving someone under 18/);
    assert.match(mail.text, /Filed: 2026-10-10 08:30 UTC/);
    assert.match(mail.text, /Review it \(administrators only\): https:\/\/chimera\.it\.com\/admin\/moderation\/reports\/00000000-0000-4000-8000-0000000000c1\n/);
    assert.ok(!(mail.subject + mail.text).includes(SECRET), 'nothing but the category, time and link');
    assert.match(mail.text, /never contains the message/);

    const calls = [];
    const ok = await sendReportAlert(async (url, init) => { calls.push({ url, init }); return { ok: true }; }, { apiKey: 'key-123', from: 'CHIMERA <alerts@chimera.it.com>', to: ['a@b.co'], ...mail });
    assert.equal(ok, true);
    assert.equal(calls[0].url, 'https://api.resend.com/emails');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer key-123');
    assert.deepEqual(JSON.parse(calls[0].init.body).to, ['a@b.co']);
    assert.equal(await sendReportAlert(async () => ({ ok: false }), { apiKey: 'k', from: 'f', to: ['a@b.co'], subject: 's', text: 't' }), false);
    assert.equal(await sendReportAlert(async () => { throw new Error('network'); }, { apiKey: 'k', from: 'f', to: ['a@b.co'], subject: 's', text: 't' }), false, 'a failed e-mail never throws');
  } finally { await vite.close(); }
});

/** A stand-in for Supabase and Resend, in front of the real handler. */
async function alertHarness({ report, alertedRecently = 0, resendOk = true, env = true } = {}) {
  const vite = await server();
  const previous = { ...process.env };
  if (env) Object.assign(process.env, { CHIMERA_REPORT_ALERT_EMAILS: 'admin@example.com', RESEND_API_KEY: 'key', CHIMERA_REPORT_ALERT_FROM: 'alerts@example.com', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  const row = report === undefined ? { id: REPORT, reporter_id: USER, reason: 'spam', created_at: '2026-10-10T08:30:00Z', content_type: 'chimera_message', alert_sent_at: null } : report;
  const log = { resend: [], claims: 0, audit: [], released: 0 };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url ?? String(input));
    const method = (init.method ?? input.method ?? 'GET').toUpperCase();
    const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
    if (url.hostname === 'api.resend.com') { log.resend.push(JSON.parse(init.body)); return json({}, resendOk ? 200 : 500); }
    if (url.pathname === '/auth/v1/user') return json({ id: USER, aud: 'authenticated', email: 'm@example.com' });
    if (url.pathname === '/rest/v1/reports') {
      if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-range': `*/${alertedRecently}` } });
      if (method === 'GET') return row ? json(row) : json({ message: 'none' }, 406);
      if (method === 'PATCH') {
        const body = JSON.parse(init.body);
        if (body.alert_sent_at === null) { log.released += 1; return json([{ id: REPORT }]); }
        if (row.alert_sent_at) return json([]);
        row.alert_sent_at = body.alert_sent_at; log.claims += 1; return json([{ id: REPORT }]);
      }
    }
    if (url.pathname === '/rest/v1/chimera_report_audit' && method === 'POST') { log.audit.push(JSON.parse(init.body)); return json({}, 201); }
    throw new Error(`unexpected ${method} ${url}`);
  };
  const { default: handler } = await vite.ssrLoadModule('/api/report-alert.ts');
  const call = (body, token = 'Bearer user-token') => handler(new Request('https://chimera.test/api/report-alert', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) }, body: JSON.stringify(body) }));
  return { call, log, row, close: async () => { globalThis.fetch = realFetch; for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key]; Object.assign(process.env, previous); await vite.close(); } };
}

test('alert API: the reporter triggers one e-mail, and it is logged', async () => {
  const h = await alertHarness();
  try {
    const response = await h.call({ report_id: REPORT });
    assert.deepEqual([response.status, await response.json()], [200, { sent: true }]);
    assert.equal(h.log.resend.length, 1);
    assert.deepEqual(h.log.resend[0].to, ['admin@example.com']);
    assert.ok(h.log.resend[0].text.includes(REPORT) && !JSON.stringify(h.log.resend[0]).includes(SECRET));
    assert.deepEqual(h.log.audit, [{ report_id: REPORT, actor_id: null, action: 'alert_sent' }]);
    // Asking again does not send again.
    const again = await h.call({ report_id: REPORT });
    assert.deepEqual(await again.json(), { sent: false, reason: 'already_sent' });
    assert.equal(h.log.resend.length, 1);
  } finally { await h.close(); }
});

test('alert API: nothing is sent for anyone but the reporter, without a session, with a bad id, when not set up, when throttled, or when the provider fails', async () => {
  let h = await alertHarness({ report: { id: REPORT, reporter_id: OTHER, reason: 'spam', created_at: '2026-10-10T08:30:00Z', content_type: 'chimera_message', alert_sent_at: null } });
  try {
    assert.equal((await h.call({ report_id: REPORT })).status, 404, 'someone else\'s report looks like a missing one');
    assert.equal((await h.call({ report_id: 'not-a-uuid' })).status, 400);
    assert.equal((await h.call({ report_id: REPORT }, null)).status, 401);
    assert.equal(h.log.resend.length, 0);
  } finally { await h.close(); }
  h = await alertHarness({ report: { id: REPORT, reporter_id: USER, reason: 'spam', created_at: '2026-10-10T08:30:00Z', content_type: 'user', alert_sent_at: null } });
  try { assert.equal((await h.call({ report_id: REPORT })).status, 404, 'only message reports'); } finally { await h.close(); }
  h = await alertHarness({ env: false });
  try {
    const r = await h.call({ report_id: REPORT });
    assert.deepEqual(await r.json(), { sent: false, reason: 'not_configured' });
    assert.equal(h.log.resend.length, 0);
  } finally { await h.close(); }
  h = await alertHarness({ alertedRecently: 5 });
  try {
    assert.deepEqual(await (await h.call({ report_id: REPORT })).json(), { sent: false, reason: 'throttled' });
    assert.equal(h.log.resend.length, 0);
    assert.equal(h.row.alert_sent_at, null, 'a throttled report can still be announced later');
  } finally { await h.close(); }
  h = await alertHarness({ resendOk: false });
  try {
    assert.deepEqual(await (await h.call({ report_id: REPORT })).json(), { sent: false, reason: 'provider_failed' });
    assert.equal(h.log.released, 1, 'the claim is given back, so a later attempt can still send');
    assert.equal(h.log.audit.length, 0);
  } finally { await h.close(); }
});
