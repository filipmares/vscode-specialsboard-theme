import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  avatarShapes, buildIcon, decodePNG, encodePNG, faviconShapes, geometry, masterShapes,
  paletteColors, rasterize, renderSVG, syncIcon
} from '../scripts/icon.mjs';
import { loadSources, root } from '../scripts/tokens.mjs';

const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const colors = paletteColors();
const shipped = readFileSync(resolve(root, manifest.icon));
const icon = decodePNG(shipped);

const compose = (data, index, background) => [0, 1, 2].map(channel => Math.round(
  data[index + channel] * (data[index + 3] / 255) + background[channel] * (1 - data[index + 3] / 255)
));

test('the shipped package icon is the exact deterministic export of the vector master', () => {
  assert.equal(manifest.icon, 'icon.png');
  const expected = decodePNG(encodePNG(rasterize(masterShapes(colors))));
  assert.deepEqual(icon.chunks, ['IHDR', 'IDAT', 'IEND'], 'ancillary PNG chunks must stay stripped');
  assert.equal(icon.width, 256);
  assert.equal(icon.height, 256);
  assert.ok(icon.data.equals(expected.data), 'icon.png is not the current generated artwork');
  assert.ok(shipped.length < 16 * 1024, `icon.png grew to ${shipped.length} bytes`);
});

test('icon regeneration and the vector sources stay drift-free', () => {
  const outputs = buildIcon();
  assert.deepEqual([...outputs.keys()], ['icon.png', 'assets/icon.svg', 'assets/icon-favicon.svg', 'assets/icon-avatar.svg']);
  assert.doesNotThrow(() => syncIcon(outputs, root, true));
  for (const [file, expected] of outputs) {
    if (file.endsWith('.svg')) assert.equal(readFileSync(resolve(root, file), 'utf8'), expected.toString('utf8'));
  }
  const master = renderSVG(masterShapes(colors));
  assert.equal(Buffer.byteLength(master), 1740, 'the approved 1740-byte master must not change');
  assert.match(master, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="256" height="256" viewBox="0 0 256 256" role="img">/);
  assert.doesNotMatch(master, /<(?:image|script|style|filter|linearGradient|radialGradient|text)\b/, 'the master stays flat vector geometry');
  for (const build of [masterShapes, faviconShapes, avatarShapes]) {
    assert.doesNotMatch(renderSVG(build(colors)), /url\(|href=|@import/);
  }
});

test('drift detection fails on replaced artwork, wrong size, and reintroduced metadata', () => {
  const expected = new Map([['icon.png', buildIcon().get('icon.png')]]);
  const raster = rasterize(masterShapes(colors));
  const scratch = mkdtempSync(resolve(tmpdir(), 'specialsboard-icon-'));
  const target = resolve(scratch, 'icon.png');
  const rejects = () => assert.throws(() => syncIcon(expected, scratch, true), /Generated icon drift/);
  try {
    rejects();

    const repainted = { ...raster, data: Buffer.from(raster.data) };
    repainted.data[(128 * 256 + 128) * 4] ^= 0xff;
    writeFileSync(target, encodePNG(repainted));
    rejects();

    writeFileSync(target, encodePNG(rasterize(masterShapes(colors), 128)));
    assert.equal(decodePNG(readFileSync(target)).width, 128);
    rejects();

    const tagged = Buffer.concat([shipped.subarray(0, 33), Buffer.from([0, 0, 0, 1, 0x73, 0x52, 0x47, 0x42, 0, 0xae, 0xce, 0x1c, 0xe9]), shipped.subarray(33)]);
    assert.deepEqual(decodePNG(tagged).chunks, ['IHDR', 'sRGB', 'IDAT', 'IEND']);
    writeFileSync(target, tagged);
    rejects();

    writeFileSync(target, Buffer.from('not a png at all'));
    rejects();

    writeFileSync(target, expected.get('icon.png'));
    assert.doesNotThrow(() => syncIcon(expected, scratch, true));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('a palette token with alpha cannot silently diverge the raster from the vector master', () => {
  const translucent = new Map(colors).set(geometry.plateToken, '#211f1e80');
  assert.throws(() => masterShapes(translucent), /opaque palette color/);
});

test('artwork colors come only from palette tokens and stay off the gallery banner', () => {
  const palette = new Set(colors.values());
  const used = new Set(masterShapes(colors).map(shape => shape.color));
  assert.equal(used.size, 10);
  for (const color of used) assert.ok(palette.has(color), `${color} is not a palette token`);
  assert.equal(colors.get(geometry.plateToken), '#211f1e');
  assert.equal(colors.get(geometry.wellToken), '#100f0e');
  assert.equal(colors.get(geometry.hairlineToken), '#655d53');
  assert.equal(colors.get(geometry.bannerToken), '#302e2c');

  assert.equal(manifest.galleryBanner.color, colors.get(geometry.bannerToken));
  assert.equal(manifest.galleryBanner.theme, 'dark');
  assert.notEqual(manifest.galleryBanner.color, colors.get(geometry.plateToken), 'the plate must not dissolve into the banner');

  const centre = (128 * 256 + 128) * 4;
  assert.deepEqual([...icon.data.subarray(centre, centre + 4)], [0x21, 0x1f, 0x1e, 255]);
  const bar = (40 * 256 + 60) * 4;
  assert.deepEqual([...icon.data.subarray(bar, bar + 4)], [0xd9, 0x95, 0x59, 255]);
});

test('the rounded plate keeps its transparent corners and stays legible on host backgrounds', () => {
  let [opaque, partial, clear] = [0, 0, 0];
  for (let index = 3; index < icon.data.length; index += 4) {
    if (icon.data[index] === 255) opaque += 1;
    else if (icon.data[index] === 0) clear += 1;
    else partial += 1;
  }
  assert.equal(opaque + partial + clear, 256 * 256);
  assert.ok(clear > 1000 && clear < 2000, `unexpected transparent corner area: ${clear}`);
  assert.ok(partial > 0 && partial < 1000, `unexpected anti-aliased edge area: ${partial}`);
  for (const corner of [[0, 0], [255, 0], [0, 255], [255, 255]]) {
    assert.equal(icon.data[(corner[1] * 256 + corner[0]) * 4 + 3], 0, 'plate corners must be transparent');
  }

  // The plate is 1.00:1 on a #1F1F1F host, so the keyline alone carries the boundary.
  const luminance = ([red, green, blue]) => {
    const channel = value => (value / 255 <= 0.04045 ? value / 255 / 12.92 : ((value / 255 + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  };
  const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
  for (const [background, floor] of [[[255, 255, 255], 8], [[31, 31, 31], 1.4], [[13, 17, 23], 1.4], [[48, 46, 44], 1.15]]) {
    const keyline = compose(icon.data, (128 * 256) * 4, background);
    assert.ok(ratio(keyline, background) >= floor, `keyline on ${background}: ${ratio(keyline, background).toFixed(2)}:1`);
  }
});

test('the master downsamples cleanly at every delivery size and keeps its safe margin', () => {
  assert.equal(geometry.origin, 24);
  assert.equal(geometry.pitch, 56);
  for (const size of [256, 128, 64, 32]) {
    assert.equal((geometry.pitch * size) % 256, 0, `pitch is not pixel-aligned at ${size}`);
    assert.equal((geometry.origin * size) % 256, 0, `safe margin is not pixel-aligned at ${size}`);
    const scaled = rasterize(masterShapes(colors), size);
    assert.equal(scaled.data.length, size * size * 4);
    assert.equal(scaled.data[3], 0, `the corner lost its transparency at ${size}`);
    const centre = ((size / 2) * size + size / 2) * 4;
    assert.deepEqual([...scaled.data.subarray(centre, centre + 3)], [0x21, 0x1f, 0x1e], `plate tone drifted at ${size}`);
  }
  // 16 px cannot land on this module, which is why the favicon sibling has its own grid.
  const small = rasterize(masterShapes(colors), 16);
  assert.ok(small.data[3] < 255, 'the 16 px corner is anti-aliased, not opaque');
  assert.notEqual((geometry.pitch * 16) % 256, 0);
  const bounds = masterShapes(colors).filter(shape => shape.kind === 'fill').slice(1);
  for (const shape of bounds) {
    assert.ok(shape.x >= 24 && shape.y >= 24, 'artwork breaks the 24 px safe margin');
    assert.ok(shape.x + shape.width <= 232 && shape.y + shape.height <= 232, 'artwork breaks the 24 px safe margin');
  }
});

test('icon provenance, documentation and lean packaging are recorded', () => {
  const { provenance } = loadSources();
  const record = provenance['brand-icon'];
  assert.ok(record, 'tokens/provenance.json must record the icon artwork');
  assert.equal(record.authority, 'judgment');
  assert.match(record.source, /scripts\/icon\.mjs/);
  assert.match(record.notes, /originally drawn/i);

  const branding = readFileSync(resolve(root, 'docs', 'branding.md'), 'utf8');
  for (const fragment of ['npm run icon', 'assets/icon.svg', '256', '24 px', 'palette.phase3.ambient', '#302e2c']) {
    assert.ok(branding.includes(fragment), `docs/branding.md must document ${fragment}`);
  }
  const ignore = readFileSync(resolve(root, '.vscodeignore'), 'utf8').split(/\r?\n/);
  assert.ok(ignore.includes('assets/**'), 'editable vector sources stay out of the VSIX');
  assert.ok(!ignore.includes('icon.png'), 'the package icon must ship');
});

test('icon CLI checks from any working directory and rejects unknown flags', () => {
  const script = resolve(root, 'scripts', 'icon.mjs');
  const result = spawnSync(process.execPath, [script, '--check'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Checked 4 icon files/);
  const invalid = spawnSync(process.execPath, [script, '--fix'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Usage:/);
});
