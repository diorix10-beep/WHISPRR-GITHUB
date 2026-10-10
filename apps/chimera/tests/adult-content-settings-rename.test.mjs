import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'vite';

const app = (path) => new URL(`../${path}`, import.meta.url);
const root = (path) => new URL(`../../../${path}`, import.meta.url);

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir);
    if (entry.isDirectory()) await walk(full, out);
    else if (/\.(tsx?|mjs|md|xml)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('the page is named Adult Content Settings everywhere a person can read it; the old name survives only in the README note about the rename', async () => {
  const files = [...(await walk(app('src/'))), ...(await walk(app('api/'))), ...(await walk(root('discord/chimera/')))];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.ok(!/Guardian(\\'|&apos;|')s Library/i.test(text), `${file.pathname} still shows the old name`);
    assert.ok(!/THE GUARDIAN/.test(text), `${file.pathname} still has the old page title`);
  }
  const readme = await readFile(app('README.md'), 'utf8');
  assert.equal((readme.match(/Guardian's Library/g) ?? []).length, 1, 'only the note that explains the rename');
  assert.ok(readme.includes('`/guardian` still works'));
});

test('the old address keeps working: /guardian redirects to the new page and keeps its query and anchor; every internal link uses the new address', async () => {
  const appSource = await readFile(app('src/App.tsx'), 'utf8');
  assert.match(appSource, /<Route path="\/adult-content-settings" element=\{<AdultContentSettingsPage \/>\} \/>/);
  assert.match(appSource, /<Route path="\/guardian" element=\{<LegacyGuardianRedirect \/>\} \/>/);
  assert.match(appSource, /const \{ search, hash \} = useLocation\(\);\s*return <Navigate to=\{\{ pathname: '\/adult-content-settings', search, hash \}\} replace \/>/);
  for (const file of await walk(app('src/'))) {
    const text = await readFile(file, 'utf8');
    if (file.pathname.endsWith('/App.tsx')) continue;
    assert.ok(!/['"]\/guardian['"]/.test(text), `${file.pathname} still links to /guardian`);
  }
  const sitemap = await readFile(app('public/sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('https://www.chimera.it.com/adult-content-settings</loc>') && !sitemap.includes('/guardian'));
});

test('nothing about the age confirmation or the adult-content switch changed: same switches, same messages, same guards', async () => {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const age = await server.ssrLoadModule('/src/lib/ageVerification.ts');
    assert.equal(age.AGE_VERIFICATION_LIVE, false);
    assert.equal(age.ADULT_CONFIRMATION_LIVE, true);
    assert.equal(age.ADULT_CONFIRMATION_VERSION, 'adult-attestation-1');
    assert.equal(age.ADULT_SETTINGS_OPEN, age.AGE_VERIFICATION_LIVE || age.ADULT_CONFIRMATION_LIVE, 'the page opens under the same condition as before');
    assert.ok(!('GUARDIAN_OPEN' in age), 'the old constant is gone, not duplicated');
    const gate = await server.ssrLoadModule('/api/_lib/adultContentGate.ts');
    assert.equal(gate.ADULT_ACCESS_MESSAGE, 'This character is rated Mature or NSFW. Verify your age and turn on adult content in the Adult Content Settings to continue.');
    assert.equal(gate.isAdultRating('SFW'), false);
    assert.equal(gate.isAdultRating('mature'), true);
    assert.equal(gate.isAdultRating(undefined), false);
  } finally { await server.close(); }
  const page = await readFile(app('src/pages/AdultContentSettingsPage.tsx'), 'utf8');
  assert.ok(page.includes('ADULT CONTENT SETTINGS') && page.includes("state={{ from: '/adult-content-settings' }}"));
  for (const phrase of ['18+ confirmed by you', 'does not check it yet', 'adult_content_enabled', 'age_verification_status', 'ADULT_CONFIRMATION_VERSION']) {
    assert.ok(page.includes(phrase), `the page still has: ${phrase}`);
  }
});
