import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function server() {
  process.env.VITE_SUPABASE_URL = 'https://synthetic.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'synthetic-test-key';
  return createServer({ root: new URL('../', import.meta.url).pathname, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
}

test('every ready-made background keeps all the light text readable (4.5:1) on its brightest point, with no dimming needed', async () => {
  const vite = await server();
  try {
    const { PRESETS, LIGHT_TEXT_COLORS, parseHex, contrast, minimumDim, MIN_CONTRAST } = await vite.ssrLoadModule('/src/lib/wallpaper.ts');
    assert.ok(PRESETS.length >= 10);
    assert.equal(new Set(PRESETS.map((p) => p.id)).size, PRESETS.length, 'unique ids');
    for (const preset of PRESETS) {
      const peak = parseHex(preset.peak);
      assert.ok(peak, `${preset.id} has a peak colour`);
      for (const text of LIGHT_TEXT_COLORS) assert.ok(contrast(parseHex(text), peak) >= MIN_CONTRAST, `${preset.id} vs ${text}: ${contrast(parseHex(text), peak).toFixed(2)}`);
      assert.equal(minimumDim(peak), 0, `${preset.id} needs no dimming`);
      // What is drawn is built from colours only: no address, no script, nothing that could load something.
      assert.doesNotMatch(preset.css, /url\(|expression|javascript|@import|;/i, preset.id);
      // Every colour used in the drawing is no brighter than the stated peak.
      for (const hex of preset.css.match(/#[0-9a-f]{6}/gi) ?? []) assert.ok(contrast(parseHex(hex), parseHex(LIGHT_TEXT_COLORS[0])) >= MIN_CONTRAST, `${preset.id} uses ${hex}`);
    }
  } finally { await vite.close(); }
});

test('a bright background is dimmed just enough: for any colour the text reaches 4.5:1, and the dimming never goes past the limit', async () => {
  const vite = await server();
  try {
    const { minimumDim, contrast, LIGHT_TEXT_COLORS, parseHex, MAX_DIM, MIN_CONTRAST, luminance, MAX_BACKGROUND_LUMINANCE, effectiveDim } = await vite.ssrLoadModule('/src/lib/wallpaper.ts');
    assert.ok(MAX_BACKGROUND_LUMINANCE > 0.06 && MAX_BACKGROUND_LUMINANCE < 0.1, String(MAX_BACKGROUND_LUMINANCE));
    assert.equal(minimumDim([0, 0, 0]), 0);
    assert.ok(minimumDim([255, 255, 255]) > 0.5 && minimumDim([255, 255, 255]) <= MAX_DIM);
    const steps = [0, 32, 64, 96, 128, 160, 192, 224, 255];
    let previous = 0;
    for (const r of steps) for (const g of steps) for (const b of steps) {
      const dim = minimumDim([r, g, b]);
      assert.ok(dim >= 0 && dim <= MAX_DIM);
      const dimmed = [r, g, b].map((c) => c * (1 - dim));
      for (const text of LIGHT_TEXT_COLORS) assert.ok(contrast(parseHex(text), dimmed) >= MIN_CONTRAST - 0.001, `rgb(${r},${g},${b}) dim ${dim} vs ${text}: ${contrast(parseHex(text), dimmed).toFixed(3)}`);
      // And it is not more than needed (one percent less would not be enough), unless nothing is needed.
      if (dim > 0 && dim < MAX_DIM) {
        const less = [r, g, b].map((c) => c * (1 - (dim - 0.011)));
        assert.ok(luminance(less) > MAX_BACKGROUND_LUMINANCE - 1e-9, `rgb(${r},${g},${b}) is dimmed more than needed`);
      }
      previous = dim;
    }
    assert.ok(previous >= 0);
    // The player may dim more, never less than needed.
    const white = { choice: { kind: 'color', color: '#ffffff' }, dim: 0 };
    assert.equal(effectiveDim(white), minimumDim([255, 255, 255]), 'asking for no dimming still dims');
    assert.equal(effectiveDim({ ...white, dim: 0.9 }), 0.9);
    assert.equal(effectiveDim({ ...white, dim: 5 }), 0.9, 'capped');
    assert.equal(effectiveDim({ choice: { kind: 'none' }, dim: 0.5 }), 0, 'no background, no dimming');
    assert.equal(effectiveDim({ choice: { kind: 'preset', id: 'ink' }, dim: 0.3 }), 0.3);
  } finally { await vite.close(); }
});

test('a picture counts as bright by its brighter parts, so a mostly dark picture with a bright spot is still dimmed', async () => {
  const vite = await server();
  try {
    const { brightPartOf } = await vite.ssrLoadModule('/src/lib/wallpaperImage.ts');
    const { effectiveDim, minimumDim, greyForLuminance, MAX_DIM, luminance, MAX_BACKGROUND_LUMINANCE } = await vite.ssrLoadModule('/src/lib/wallpaper.ts');
    const fill = (n, [r, g, b, a = 255]) => Uint8Array.from({ length: n * 4 }, (_, i) => [r, g, b, a][i % 4]);
    assert.ok(brightPartOf(fill(100, [255, 255, 255])) > 0.99);
    assert.ok(brightPartOf(fill(100, [0, 0, 0])) < 0.001);
    assert.ok(brightPartOf(fill(100, [255, 255, 255, 0])) < 0.001, 'see-through counts as dark');
    const mixed = new Uint8Array([...fill(90, [10, 10, 10]), ...fill(10, [255, 255, 255])]);
    assert.ok(brightPartOf(mixed) > 0.9, 'ten percent bright is enough to count');
    const mostlyDark = new Uint8Array([...fill(97, [10, 10, 10]), ...fill(3, [255, 255, 255])]);
    assert.ok(brightPartOf(mostlyDark) < 0.05, 'a tiny bright dot does not dim the whole picture');
    assert.deepEqual(brightPartOf(new Uint8Array(0)), 0);
    const grey = greyForLuminance(0.5);
    assert.ok(Math.abs(luminance(grey) - 0.5) < 0.01);
    for (const l of [0, 0.05, 0.2, 0.5, 0.9, 1]) {
      const dim = effectiveDim({ choice: { kind: 'image', luminance: l }, dim: 0 });
      const dimmed = greyForLuminance(l).map((c) => c * (1 - dim));
      assert.ok(luminance(dimmed) <= MAX_BACKGROUND_LUMINANCE + 1e-6, `luminance ${l} -> dim ${dim}`);
      assert.ok(dim <= MAX_DIM);
    }
    assert.equal(minimumDim(greyForLuminance(0.01)), 0);
  } finally { await vite.close(); }
});

test('the choice is kept in this browser, forgotten when there is none, and broken or tampered data cannot hurt', async () => {
  const vite = await server();
  try {
    const { readWallpaper, writeWallpaper, normalizeWallpaper, DEFAULT_WALLPAPER, backgroundCss } = await vite.ssrLoadModule('/src/lib/wallpaper.ts');
    const map = new Map();
    const storage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
    assert.deepEqual(readWallpaper(storage), DEFAULT_WALLPAPER);
    const mine = { choice: { kind: 'preset', id: 'dusk' }, dim: 0.4 };
    assert.equal(writeWallpaper(mine, storage), true);
    assert.deepEqual(readWallpaper(storage), mine);
    assert.equal(writeWallpaper({ ...DEFAULT_WALLPAPER }, storage), true);
    assert.equal(map.size, 0, 'none leaves nothing stored');
    // Tampered or odd data.
    for (const bad of [null, undefined, 5, 'x', [], { c: 5 }, { c: { kind: 'preset', id: 'nope' } }, { c: { kind: 'color', color: 'red' } }, { c: { kind: 'color', color: 'url(http://evil)' } }, { c: { kind: 'color', color: '#12345' } }, { c: { kind: 'image', luminance: 'bright' } }, { c: { kind: 'image', luminance: NaN } }, { c: { kind: '__proto__' } }]) {
      assert.deepEqual(normalizeWallpaper(bad), DEFAULT_WALLPAPER, JSON.stringify(bad));
    }
    assert.deepEqual(normalizeWallpaper({ c: { kind: 'color', color: ' #AABBCC ' }, dim: 7 }), { choice: { kind: 'color', color: '#aabbcc' }, dim: 0.9 });
    assert.deepEqual(normalizeWallpaper({ c: { kind: 'image', luminance: 4 }, dim: -3 }), { choice: { kind: 'image', luminance: 1 }, dim: 0 });
    map.set('chimera.chat.wallpaper', '{broken');
    assert.deepEqual(readWallpaper(storage), DEFAULT_WALLPAPER);
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    assert.deepEqual(readWallpaper(broken), DEFAULT_WALLPAPER);
    assert.equal(writeWallpaper(mine, broken), false);
    assert.equal(writeWallpaper(mine, null), false);
    // Only a six-digit colour ever reaches the style.
    assert.equal(backgroundCss({ kind: 'color', color: '#aabbcc' }), '#aabbcc');
    assert.equal(backgroundCss({ kind: 'color', color: 'red; background: url(x)' }), null);
    assert.equal(backgroundCss({ kind: 'preset', id: 'nope' }), null);
    assert.equal(backgroundCss({ kind: 'none' }), null);
  } finally { await vite.close(); }
});

// A few bytes of each kind of header, built by hand.
const png = (w, h) => { const b = new Uint8Array(33); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]); new DataView(b.buffer).setUint32(16, w); new DataView(b.buffer).setUint32(20, h); return b; };
const jpeg = (w, h) => Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xdb, 0x00, 0x04, 0, 0, 0xff, 0xc0, 0x00, 0x11, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
const webpX = (w, h) => { const b = new Uint8Array(40); b.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0, 0, 0, 0, 0]); const x = w - 1, y = h - 1; b.set([x & 255, (x >> 8) & 255, (x >> 16) & 255, y & 255, (y >> 8) & 255, (y >> 16) & 255], 24); return b; };
const webpL = (w, h) => { const b = new Uint8Array(40); b.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c, 0, 0, 0, 0, 0x2f]); const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14); b.set([bits & 255, (bits >> 8) & 255, (bits >> 16) & 255, (bits >>> 24) & 255], 21); return b; };
const webpLossy = (w, h) => { const b = new Uint8Array(40); b.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0, 0, 0, 0, 0x9d, 0x01, 0x2a, w & 255, w >> 8, h & 255, h >> 8]); return b; };

test('a file is judged by its own bytes and its header before anything is decoded: wrong kinds, empty, too big and decompression bombs are refused', async () => {
  const vite = await server();
  try {
    const { sniffImage, readImageSize, checkImageBytes, MAX_FILE_BYTES, WallpaperImageError } = await vite.ssrLoadModule('/src/lib/wallpaperImage.ts');
    assert.equal(sniffImage(png(10, 10)), 'png');
    assert.equal(sniffImage(jpeg(10, 10)), 'jpeg');
    assert.equal(sniffImage(webpX(10, 10)), 'webp');
    assert.equal(sniffImage(new TextEncoder().encode('GIF89a......')), null);
    assert.equal(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null, 'an SVG can carry script: never accepted');
    assert.equal(sniffImage(new TextEncoder().encode('MZ executable')), null);
    assert.equal(sniffImage(new Uint8Array(0)), null);
    assert.deepEqual(readImageSize(png(1920, 1080), 'png'), { width: 1920, height: 1080 });
    assert.deepEqual(readImageSize(jpeg(4032, 3024), 'jpeg'), { width: 4032, height: 3024 });
    assert.deepEqual(readImageSize(webpX(1600, 900), 'webp'), { width: 1600, height: 900 });
    assert.deepEqual(readImageSize(webpL(800, 600), 'webp'), { width: 800, height: 600 });
    assert.deepEqual(readImageSize(webpLossy(640, 480), 'webp'), { width: 640, height: 480 });
    assert.equal(readImageSize(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), 'png'), null, 'a cut-off header');
    assert.equal(readImageSize(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]), 'jpeg'), null);
    // A camera or colour-profile segment can be large: the size marker then sits past the first 64 KiB.
    const plain = jpeg(4032, 3024);
    // Segment lengths are 16-bit: four 60 KB profile segments in a row.
    const profile = new Uint8Array(4 * 60_002);
    for (let k = 0; k < 4; k += 1) profile.set([0xff, 0xe2, 60_000 >> 8, 60_000 & 255], k * 60_002);
    const withProfile = new Uint8Array(plain.length + profile.length);
    withProfile.set(plain.subarray(0, 2));
    withProfile.set(profile, 2);
    withProfile.set(plain.subarray(2), 2 + profile.length);
    assert.equal(readImageSize(withProfile.subarray(0, 64 * 1024), 'jpeg'), null, 'not in the first 64 KiB');
    assert.deepEqual(readImageSize(withProfile, 'jpeg'), { width: 4032, height: 3024 });
    const refuses = (bytes, size, pattern) => assert.throws(() => checkImageBytes(bytes, size), (e) => e instanceof WallpaperImageError && pattern.test(e.message));
    assert.equal(checkImageBytes(png(1920, 1080), 500_000), 'png');
    assert.equal(checkImageBytes(jpeg(4000, 3000), 3_000_000), 'jpeg', '12 megapixels is fine');
    refuses(new Uint8Array(0), 0, /empty/);
    refuses(png(10, 10), MAX_FILE_BYTES + 1, /larger than 8 MB/);
    refuses(new TextEncoder().encode('just text pretending to be photo.png'), 40, /JPG, PNG or WebP/);
    refuses(png(30_000, 30_000), 90_000, /too large in pixels/);
    refuses(png(100_000, 1), 1_000, /too large in pixels/);
    refuses(jpeg(8_000, 8_000), 2_000_000, /too large in pixels/);
    refuses(webpX(16_384, 16_384), 100_000, /too large in pixels/);
    refuses(png(0, 10), 1_000, /could not be read/);
    refuses(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 8, /could not be read/);
  } finally { await vite.close(); }
});

test('the picture never leaves the device: the code that handles it has no network, database or server call, and the layer is behind everything', async () => {
  for (const file of ['src/lib/wallpaper.ts', 'src/lib/wallpaperImage.ts', 'src/lib/wallpaperStore.ts', 'src/hooks/useWallpaper.ts', 'src/components/chat/WallpaperLayer.tsx', 'src/components/chat/panel/WallpaperSection.tsx']) {
    assert.doesNotMatch(await read(file), /supabase|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
  }
  const layer = await read('src/components/chat/WallpaperLayer.tsx');
  assert.match(layer, /aria-hidden="true"/);
  assert.match(layer, /pointer-events-none absolute inset-0 -z-10/);
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /<div className="relative isolate">\s*<WallpaperLayer/);
  const image = await read('src/lib/wallpaperImage.ts');
  assert.match(image, /canvas\.toBlob\(resolve, 'image\/jpeg'/, 'redrawn as a JPEG: camera details are gone');
  assert.match(image, /checkImageBytes\(head, file\.size\)/, 'checked before it is decoded');
  const section = await read('src/components/chat/panel/WallpaperSection.tsx');
  assert.match(section, /accept="image\/jpeg,image\/png,image\/webp"/, 'no SVG, no GIF');
  assert.match(section, /it is not uploaded and nobody else can see it/);
  assert.match(section, /role="radiogroup"/);
  assert.match(section, /onKeyDown=\{radioGroupKeys\}/);
  assert.match(await read('src/components/chat/panel/LookSection.tsx'), /<WallpaperSection wallpaper=\{wallpaper\} \/>/);
});
