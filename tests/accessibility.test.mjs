import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { buildThemes } from '../scripts/generate.mjs';
import { colorToHex, compileSources, loadSources, root } from '../scripts/tokens.mjs';
import { composite, contrast, difference, linear, oklab, rgba, simulate, visionModes } from '../scripts/color.mjs';
import { adjacentPairs, differentiationFloor } from '../scripts/accessibility-pairs.mjs';
import { buildEvidence, checkEvidence, evaluateTheme, failures, resolveBackground } from '../scripts/accessibility.mjs';
import { syntaxStates, workbenchCases } from '../scripts/accessibility-cases.mjs';

const sources = loadSources();
const outputs = buildThemes(sources);
const models = compileSources(sources);
const model = models.find(item => item.variant.key === 'contrast');
const theme = JSON.parse(outputs.get(model.variant.output));
const evidence = buildEvidence(sources);
const result = evidence.results.find(item => item.key === 'contrast');

test('all non-Contrast generated theme bytes are frozen at public v3.1.0', () => {
  const hashes = {
    'specialsboard-flagship.json': 'fdee4d1b84ec6c0edf0d57d800c66353b7cfacf5c2506d8a9f44f5e87c5fb361',
    'specialsboard-classic.json': '0b2711e4f39bda94aaa638724fd745f4dea9afe54a25e439c7c7323fdaf35cd4',
    'specialsboard.json': 'fee187b5cac5c7f04ee4ca00a5bbb56ced8453c22487ccaeccf67950eb9ba5dc'
  };
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(createHash('sha256').update(outputs.get(file)).digest('hex'), hash, file);
  }
});

test('sRGB transfer, luminance contrast and source-over alpha match independent reference cases', () => {
  assert.equal(contrast(rgba('#ffffff'), rgba('#000000')), 21);
  assert.equal(contrast(rgba('#123456'), rgba('#123456')), 1);
  assert.ok(Math.abs(contrast(rgba('#777777'), rgba('#ffffff')) - 4.478089453577214) < 1e-12);
  assert.equal(linear(0.04045), 0.04045 / 12.92);
  assert.deepEqual(composite(rgba('#ffffff00'), rgba('#123456')), rgba('#123456'));
  const gray = composite(rgba('#ffffff80'), rgba('#000000'));
  assert.equal(gray[0], 128 / 255);
  assert.equal(gray[3], 1);
  assert.ok(Math.abs(contrast(gray, rgba('#000000')) - 5.317210002277984) < 1e-12);
  assert.deepEqual(composite([1, 0, 0, 0], [0, 0, 1, 0]), [0, 0, 0, 0]);
  assert.throws(() => rgba('#fff'), /Invalid color/);
  assert.throws(() => contrast(rgba('#ffffff'), rgba('#00000000')), /opaque/);
  assert.throws(() => resolveBackground({ a: '#ffffff80' }, ['a']), /Unresolved transparency/);
  assert.throws(() => resolveBackground({}, ['missing']), /Missing background/);
});

test('CVD uses linear-light Machado red-green and both Brettel tritan planes with clipping', () => {
  assert.deepEqual(simulate(rgba('#ff0000'), 'protanopia'), { rgb: [0.152286, 0.114503, 0], clipped: true });
  assert.deepEqual(simulate(rgba('#ff0000'), 'deuteranopia'), { rgb: [0.367322, 0.280085, 0], clipped: true });
  assert.deepEqual(simulate(rgba('#ff0000'), 'tritanopia'), { rgb: [1, 0, 0.07589], clipped: true });
  assert.deepEqual(simulate(rgba('#0000ff'), 'tritanopia'), { rgb: [0, 0.12320, 0.24796], clipped: true });
  assert.equal(simulate(rgba('#808080'), 'normal').rgb[0], linear(128 / 255));
  const red = oklab([1, 0, 0]);
  for (const [i, expected] of [0.62795536, 0.22486306, 0.12584630].entries()) assert.ok(Math.abs(red[i] - expected) < 1e-7);
  for (const mode of visionModes) assert.equal(difference(rgba('#abcdef'), rgba('#abcdef'), mode).distance, 0);
  assert.throws(() => simulate(rgba('#ffffff80'), 'normal'), /opaque/);
  assert.throws(() => simulate(rgba('#ffffff'), 'unknown'), /Unknown vision/);
});

test('Contrast passes every declared floor and every predeclared pair/mode', () => {
  assert.deepEqual(failures(result), []);
  assert.equal(differentiationFloor, 0.05);
  assert.equal(adjacentPairs.length, 12);
  assert.deepEqual(visionModes, ['normal', 'deuteranopia', 'protanopia', 'tritanopia']);
  assert.ok(result.rows.filter(row => row.kind === 'syntax' && row.minimum === 7).length >= 138);
  assert.ok(result.rows.some(row => row.group === 'inline/modified/selection+find'));
  assert.ok(result.rows.some(row => row.group === 'terminal/inactiveSelectionBackground'));
  assert.ok(result.rows.some(row => row.group === 'state-indicator/diffEditor.insertedTextBorder'));
});

test('floors never round a failure into success and no vision mode is averaged away', () => {
  assert.equal(failures({ rows: [{ group: 'rounding', foreground: 'text', backgrounds: ['canvas'], ratio: 4.499999, minimum: 4.5 }], cvd: [] }).length, 1);
  const pair = structuredClone(result.cvd[0]);
  pair.modes.tritanopia.distance = 0.049999;
  assert.equal(failures({ rows: [], cvd: [pair] }).length, 1);
});

test('layer order is real source-over, not a single alpha or rounded intermediate', () => {
  const colors = { base: '#181715', selection: '#8aafcb40', find: '#efc17b4d' };
  const left = resolveBackground(colors, ['base', 'selection', 'find']);
  const right = resolveBackground(colors, ['base', 'find', 'selection']);
  assert.notDeepEqual(left, right);
  assert.deepEqual(left, composite(rgba(colors.find), composite(rgba(colors.selection), rgba(colors.base))));
});

test('overlays, ghost text, focus borders and alpha regressions fail even with readable base syntax', () => {
  for (const [id, value] of [
    ['editor.selectionBackground', '#ffffff99'],
    ['diffEditor.insertedTextBackground', '#ffffff80'],
    ['inlineEdit.modifiedChangedLineBackground', '#ffffff80'],
    ['editorGhostText.foreground', '#222222'],
    ['focusBorder', '#222222'],
    ['editorUnnecessaryCode.opacity', '#00000040'],
    ['terminal.inactiveSelectionBackground', '#eeeeeeaa'],
    ['chat.linesRemovedForeground', '#f08d8210']
  ]) {
    const changed = structuredClone(theme);
    changed.colors[id] = value;
    assert.ok(failures(evaluateTheme(changed, model)).length, `${id} must be release-blocking`);
  }
});

test('a semantic color collision fails differentiation independently of readable text', () => {
  const changed = { ...model, tokens: new Map(model.tokens) };
  changed.tokens.set('semantic.syntax.property', model.tokens.get('semantic.syntax.string'));
  assert.ok(failures(evaluateTheme(theme, changed)).some(error => error.startsWith('property/string')));
});

test('missing rendering layers and unreviewed IDs fail closed', () => {
  const colors = { ...theme.colors };
  delete colors['inlineEdit.modifiedChangedTextBackground'];
  assert.throws(() => syntaxStates(colors), /Missing syntax rendering context/);
  assert.throws(() => workbenchCases({ ...theme.colors, 'newWidget.foreground': '#eeeeee' }), /No reviewed rendering context/);
  const all = new Set([...workbenchCases(theme.colors).records.map(row => row.foreground), ...workbenchCases(theme.colors).excluded.map(row => row.id)]);
  assert.deepEqual([...all].sort(), Object.keys(theme.colors).sort());
});

test('Contrast preserves syntax scopes, font styles and semantic classification while changing family colors', () => {
  const flagship = JSON.parse(outputs.get('specialsboard-flagship.json'));
  const shape = rules => rules.map(rule => ({ ...rule, settings: { ...rule.settings, foreground: undefined } }));
  assert.deepEqual(shape(theme.tokenColors), shape(flagship.tokenColors));
  assert.deepEqual(Object.keys(theme.semanticTokenColors), Object.keys(flagship.semanticTokenColors));
  assert.equal(theme.tokenColors.find(rule => rule.scope === 'invalid').settings.fontStyle, 'underline');
  assert.equal(theme.semanticTokenColors.comment.italic, true);
  assert.equal(theme.colors['editorUnnecessaryCode.opacity'], '#000000');
  assert.ok(theme.colors['editorUnnecessaryCode.border']);
  assert.ok(theme.colors.contrastBorder && theme.colors.contrastActiveBorder);
});

test('selective lightness adjustments retain hue and chroma, not a flattened pastel palette', () => {
  const flagship = models.find(item => item.variant.key === 'flagship');
  for (const role of ['keyword', 'string', 'number', 'function', 'variable', 'type', 'attribute', 'regexp', 'escape']) {
    const lab = item => oklab(rgba(colorToHex(item.tokens.get(`semantic.syntax.${role}`))).slice(0, 3).map(linear));
    const a = lab(flagship), b = lab(model);
    const hue = value => Math.atan2(value[2], value[1]) * 180 / Math.PI;
    const delta = Math.abs(hue(a) - hue(b));
    assert.ok(Math.min(delta, 360 - delta) <= 6, `${role} changed hue family`);
    assert.ok(Math.hypot(b[1], b[2]) / Math.hypot(a[1], a[2]) >= 0.85, `${role} lost chroma`);
  }
  for (const role of ['string', 'number', 'variable']) {
    assert.deepEqual(model.tokens.get(`semantic.syntax.${role}`), flagship.tokens.get(`semantic.syntax.${role}`));
  }
});

test('evidence is deterministic and reports historical failures without passing them off as accessible', () => {
  assert.equal(buildEvidence(sources).report, evidence.report);
  assert.equal(readFileSync(resolve(root, 'docs', 'accessibility-report.md'), 'utf8'), evidence.report);
  for (const key of ['flagship', 'classic', 'legacy']) {
    assert.ok(failures(evidence.results.find(item => item.key === key)).length);
  }
  assert.match(evidence.report, /historical shortfalls explicitly retained/);
  assert.match(evidence.report, /Below 7 text/);
});

test('read-only evidence gate detects changed and missing reports without repairing them', t => {
  const directory = mkdtempSync(resolve(tmpdir(), 'specialsboard-evidence-'));
  t.after(() => rmSync(directory, { recursive: true }));
  const path = resolve(directory, 'report.md');
  assert.throws(() => checkEvidence(evidence.report, path), /ENOENT/);
  writeFileSync(path, 'stale');
  assert.throws(() => checkEvidence(evidence.report, path), /evidence drift/);
  assert.equal(readFileSync(path, 'utf8'), 'stale');
});
