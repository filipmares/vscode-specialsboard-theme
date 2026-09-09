import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { buildThemes, syncThemes } from '../scripts/generate.mjs';
import { colorToHex, compileSources, loadSources, root, stableJson, validateSchema } from '../scripts/tokens.mjs';

const fixturePath = resolve(root, 'tests', 'fixtures', 'phase0-theme.json');
const fixtureBytes = readFileSync(fixturePath);
const fixture = JSON.parse(fixtureBytes);
const sources = loadSources();
const themes = buildThemes(sources);

function appearance(theme) {
  function normalize(value) {
    if (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)) {
      const hex = value.slice(1).toLowerCase();
      return `#${hex.length === 3 ? [...hex].map(c => c + c).join('') : hex}`;
    }
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
    }
    return value;
  }
  const copy = normalize(theme);
  delete copy.name;
  return copy;
}

function overrides(group, name, target) {
  return {
    $extensions: {
      'org.specialsboard.provenance': {
        source: 'phase1-role-extraction', evidence: 'Synthetic override for generator tests; never shipped.'
      }
    },
    semantic: { [group]: { [name]: { $type: 'color', $value: `{${target}}` } } }
  };
}

function rejectMutation(mutate, pattern) {
  const input = structuredClone(sources);
  mutate(input);
  assert.throws(() => buildThemes(input), pattern);
}

test('frozen fixture is the unmodified Phase 0 extraction', () => {
  assert.equal(createHash('sha256').update(fixtureBytes).digest('hex'), 'aca5338f421a3c2de5aef246a669451019cfdf7d9796ddb10b4e418b5f4edc90');
  assert.equal(fixture.tokenColors.length, 156);
  assert.equal(Object.keys(fixture.colors).length, 47);
});

test('Legacy preserves all colors, scope strings, rule order and font styles', () => {
  const legacy = JSON.parse(themes.get('specialsboard.json'));
  assert.deepEqual(appearance(legacy), appearance(fixture));
  assert.equal(legacy.colors['editor.selectionBackground'], '#6c99bb33');
  for (const rule of legacy.tokenColors.filter(rule => rule.scope.startsWith?.('invalid.'))) {
    assert.equal(rule.settings.foreground, '#e6e1dc');
    assert.equal(rule.settings.background, '#a71e17');
  }
  assert.equal(Object.hasOwn(legacy, 'semanticHighlighting'), false);
  assert.equal(Object.hasOwn(legacy, 'semanticTokenColors'), false);
});

test('four normalized IDs and labels identify deprecated VS Code Legacy', () => {
  assert.deepEqual(sources.variants.map(({ key, id, label, vscodeId }) => [key, id, label, vscodeId]), [
    ['flagship', 'specials-board', 'Specials Board', 'specials-board'],
    ['classic', 'specials-board-classic', 'Specials Board Classic', 'specials-board-classic'],
    ['contrast', 'specials-board-contrast', 'Specials Board Contrast', 'specials-board-contrast'],
    ['legacy', 'specials-board-legacy', 'Specials Board VS Code Legacy [Deprecated]', 'specials-board-legacy']
  ]);
  assert.equal(sources.variants.find(v => v.key === 'legacy').inherits, 'base');
  for (const variant of sources.variants) {
    assert.equal(variant.vscodeId, variant.id);
    const output = JSON.parse(themes.get(variant.output));
    assert.equal(output.name, variant.label);
    assert.equal(variant.status, { legacy: 'compatibility', contrast: 'accessibility-focused', flagship: 'restored', classic: 'restored' }[variant.key]);
  }
});

test('the historical saved Legacy ID is intentionally retired without a compatibility alias', () => {
  const contributions = sources.manifest.contributes.themes;
  assert.equal(contributions.length, 4);
  assert.equal(contributions.find(theme => theme.id === 'Specials Board '), undefined);
  assert.deepEqual(contributions.find(theme => theme.id === 'specials-board-legacy'), {
    id: 'specials-board-legacy',
    label: 'Specials Board VS Code Legacy [Deprecated]',
    uiTheme: 'vs-dark',
    path: './themes/specialsboard.json'
  });
});

test('generation is deterministic, insensitive to object order, and does not mutate sources', () => {
  const before = structuredClone(sources);
  function reverse(value) {
    if (Array.isArray(value)) return value.map(reverse);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reverse(item)]));
    }
    return value;
  }
  assert.deepEqual(buildThemes(sources), themes);
  assert.deepEqual(buildThemes(reverse(sources)), themes);
  assert.deepEqual(sources, before);
  for (const output of themes.values()) {
    assert.equal(output.includes('\r'), false);
    assert.ok(output.endsWith('\n'));
    assert.equal(stableJson(JSON.parse(output)), output);
  }
});

test('small role overrides flow through inheritance without touching Legacy or siblings', () => {
  const input = structuredClone(sources);
  input.overrides.flagship = overrides('syntax', 'keyword', 'palette.coda1.copper');
  input.overrides.classic = overrides('syntax', 'keyword', 'palette.coda1.blue');
  input.overrides.contrast = { $description: 'Synthetic unoverridden child for inheritance coverage.' };
  const models = compileSources(input);
  const expected = { flagship: '#cc762e', classic: '#6c99bb', contrast: '#cc762e', legacy: '#ac4639' };
  for (const model of models) {
    assert.equal(colorToHex(model.tokens.get('semantic.syntax.keyword')), expected[model.variant.key]);
  }
  const changed = buildThemes(input);
  for (const variant of input.variants) {
    const theme = JSON.parse(changed.get(variant.output));
    assert.equal(theme.tokenColors.find(rule => rule.scope === 'keyword').settings.foreground, expected[variant.key]);
  }
  assert.equal(changed.get('specialsboard.json'), themes.get('specialsboard.json'));
});

test('semantic overrides propagate to component aliases, preserving distinct semantic roles', () => {
  const input = structuredClone(sources);
  input.overrides.flagship = overrides('surface', 'canvas', 'palette.coda1.charcoal');
  const output = JSON.parse(buildThemes(input).get('specialsboard-flagship.json'));
  assert.equal(output.colors['editor.background'], '#2b2b2b');
  assert.equal(output.colors['tab.activeBackground'], '#2b2b2b');
  assert.equal(output.colors['activityBar.background'], '#211f1e');
});

test('token resolver can serve another adapter without VS Code mappings', () => {
  const input = structuredClone(sources);
  delete input.mapping;
  delete input.manifest;
  const legacy = compileSources(input).find(model => model.variant.key === 'legacy');
  assert.deepEqual(legacy.tokens.get('semantic.surface.canvas').components, [56 / 255, 57 / 255, 57 / 255]);
});

test('DTCG sRGB byte conversion, alpha and fallback are explicit', () => {
  assert.equal(colorToHex({ colorSpace: 'srgb', components: [0, 0.5, 1] }), '#0080ff');
  assert.equal(colorToHex({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 0 }), '#00000000');
  assert.equal(colorToHex({ colorSpace: 'srgb', components: [1, 1, 1], alpha: 1 }), '#ffffff');
  rejectMutation(s => { s.palette.palette.legacy.charcoal.$value.hex = '#000000'; }, /fallback.*does not match/);
});

test('schema rejects malformed token and color values', () => {
  for (const invalid of [
    { colorSpace: 'display-p3', components: [0, 0, 0] },
    { colorSpace: 'srgb', components: [0, 0] },
    { colorSpace: 'srgb', components: [0, 0, 1.1] },
    { colorSpace: 'srgb', components: [0, 0, 0], alpha: -1 },
    { colorSpace: 'srgb', components: [0, 0, 0], alpha: 1.1 },
    '#abcdef'
  ]) {
    rejectMutation(s => { s.palette.palette.legacy.charcoal.$value = invalid; }, /palette:/);
  }
  rejectMutation(s => { s.semantic.semantic.syntax.keyword.$type = 'string'; }, /semantic:/);
  rejectMutation(s => { s.semantic.semantic.syntax.keyword.extra = true; }, /semantic:/);
});

test('rejects unresolved aliases, alias cycles and invalid namespace boundaries', () => {
  rejectMutation(s => { s.semantic.semantic.syntax.keyword.$value = '{palette.legacy.missing}'; }, /Unresolved token/);
  rejectMutation(s => { s.semantic.semantic.syntax.keyword.$value = '{semantic.syntax.keyword}'; }, /alias cycle/);
  rejectMutation(s => {
    s.semantic.semantic.syntax.keyword.$value = '{semantic.syntax.string}';
    s.semantic.semantic.syntax.string.$value = '{semantic.syntax.keyword}';
  }, /alias cycle/);
  rejectMutation(s => { s.semantic.semantic.syntax.keyword.$value = '{component.editor.background}'; }, /Invalid layer/);
  rejectMutation(s => { s.components.component.editor.background.$value = '{palette.legacy.charcoal}'; }, /Invalid layer/);
  rejectMutation(s => { s.semantic.semantic.syntax.keyword.$value = s.palette.palette.legacy.brick.$value; }, /Raw colors/);
  rejectMutation(s => { s.semantic.accidental = s.semantic.semantic; }, /Wrong namespace/);
});

test('checks unused tokens and requires traceable provenance', () => {
  rejectMutation(s => { s.palette.palette.coda1.copper.$value = '{palette.missing.color}'; }, /Unresolved token/);
  rejectMutation(s => { delete s.palette.palette.coda1.copper.$extensions; }, /missing provenance/);
  rejectMutation(s => { s.palette.palette.coda1.copper.$extensions['org.specialsboard.provenance'].source = 'unverified'; }, /unknown provenance/);
  rejectMutation(s => { s.provenance.phase0.authority = 'official-coda2'; }, /provenance:/);
});

test('rejects unknown, raw, cyclic, and palette-mutating variant overrides', () => {
  rejectMutation(s => { s.overrides.classic = overrides('syntax', 'typo', 'palette.coda1.blue'); }, /Unknown override/);
  rejectMutation(s => {
    s.overrides.classic = overrides('syntax', 'keyword', 'palette.coda1.blue');
    s.overrides.classic.semantic.syntax.keyword.$value = s.palette.palette.coda1.blue.$value;
  }, /must be aliases/);
  rejectMutation(s => { s.overrides.classic = structuredClone(s.palette); }, /cannot override palette/);
  rejectMutation(s => { s.variants[0].inherits = 'classic'; }, /inheritance cycle/);
  rejectMutation(s => { s.variants[0].inherits = 'unknown'; }, /variants:/);
  rejectMutation(s => { s.overrides.classic = overrides('syntax', 'keyword', 'semantic.syntax.keyword'); }, /alias cycle/);
});

test('rejects mapping literals and direct palette references on every platform surface', () => {
  for (const reference of ['#ffffff', 'white', '{palette.legacy.white}', '{semantic.missing.color}']) {
    for (const mutate of [
      s => { s.mapping.workbench['editor.foreground'] = reference; },
      s => { s.mapping.legacyWorkbench['editor.foreground'] = reference; },
      s => { s.mapping.contrastWorkbench['contrastBorder'] = reference; },
      s => { s.mapping.textMate[0].settings.foreground = reference; },
      s => { s.mapping.legacyTextMate[0].settings.foreground = reference; },
      s => { s.mapping.ansi.white = reference; },
      s => { s.mapping.semanticTokens.variable = reference; },
      s => { s.mapping.semanticTokens.variable = { foreground: reference, italic: true }; }
    ]) {
      rejectMutation(mutate, /vscode-mapping:|must reference roles|Unresolved mapping token/);
    }
  }
});

test('rejects unsupported styles, malformed ANSI tables and unmanaged output properties', () => {
  rejectMutation(s => { s.mapping.textMate[0].settings.fontStyle = 'blinking'; }, /vscode-mapping:/);
  rejectMutation(s => { s.mapping.textMate[0].settings.otherColor = '{semantic.syntax.string}'; }, /vscode-mapping:/);
  rejectMutation(s => { delete s.mapping.ansi.red; }, /vscode-mapping:/);
  rejectMutation(s => { s.mapping.ansi.notASlot = s.mapping.ansi.red; }, /vscode-mapping:/);
  rejectMutation(s => { s.mapping.workbench['terminal.ansiRed'] = '{semantic.terminal.red}'; }, /ANSI slot belongs/);
  const output = JSON.parse(themes.get('specialsboard.json'));
  assert.throws(() => validateSchema('vscode-theme', { ...output, unexpected: true }), /additional properties/);
  assert.throws(() => validateSchema('vscode-theme', { ...output, colors: { 'editor.background': 'blue' } }), /must match pattern/);
});

test('semantic-token adapter supports color and style references, always excluding Legacy', () => {
  const input = structuredClone(sources);
  input.mapping.semanticTokens = {
    variable: '{semantic.syntax.variable}',
    'variable.readonly': { foreground: '{semantic.syntax.constant}', italic: true, bold: false },
    function: { underline: true }
  };
  const theme = JSON.parse(buildThemes(input).get('specialsboard-flagship.json'));
  assert.equal(theme.semanticHighlighting, true);
  assert.deepEqual(theme.semanticTokenColors, {
    variable: '#cec8e8',
    'variable.readonly': { foreground: '#8aafcb', italic: true, bold: false },
    function: { underline: true }
  });
  const legacy = JSON.parse(buildThemes(input).get('specialsboard.json'));
  assert.equal(Object.hasOwn(legacy, 'semanticHighlighting'), false);
  assert.equal(Object.hasOwn(legacy, 'semanticTokenColors'), false);
});

test('every generated color is managed by the resolved token graph', () => {
  const models = compileSources(sources);
  for (const model of models) {
    const known = new Set([...model.tokens.values()].map(colorToHex));
    const theme = JSON.parse(themes.get(model.variant.output));
    const emitted = [...Object.values(theme.colors), ...Object.values(theme.semanticTokenColors ?? {}).flatMap(style =>
      typeof style === 'string' ? [style] : style.foreground ? [style.foreground] : []
    ), ...theme.tokenColors.flatMap(rule =>
      Object.entries(rule.settings).filter(([key]) => key !== 'fontStyle').map(([, color]) => color)
    )];
    for (const color of emitted) assert.ok(known.has(color), `Unmanaged output color: ${color}`);
  }
});

test('manifest drift, duplicate IDs and unsafe output paths fail', () => {
  rejectMutation(s => { s.manifest.contributes.themes[3].id = 'Specials Board'; }, /contributions/);
  rejectMutation(s => {
    s.manifest.contributes.themes[3].id = 'changed';
    s.variants[3].vscodeId = 'changed';
  }, /normalized deprecated identity/);
  for (const key of ['key', 'id', 'label', 'vscodeId', 'output']) {
    rejectMutation(s => { s.variants[1][key] = s.variants[0][key]; }, /Duplicate variant/);
  }
  rejectMutation(s => { s.variants[0].output = '../package.json'; }, /variants:/);
});

test('Legacy identity guard rejects the retired ID, missing deprecation and path changes', () => {
  rejectMutation(s => {
    s.variants[3].vscodeId = 'Specials Board ';
    s.manifest.contributes.themes[3].id = 'Specials Board ';
  }, /normalized deprecated identity/);
  rejectMutation(s => {
    s.variants[3].label = 'Specials Board VS Code Legacy';
    s.manifest.contributes.themes[3].label = 'Specials Board VS Code Legacy';
  }, /normalized deprecated identity/);
  rejectMutation(s => {
    s.variants[3].output = 'specialsboard-legacy.json';
    s.manifest.contributes.themes[3].path = './themes/specialsboard-legacy.json';
  }, /preserve its output path/);
});

test('drift check catches changed, missing, CRLF, and extra outputs without repairing them', t => {
  const directory = mkdtempSync(resolve(tmpdir(), 'specialsboard-drift-'));
  t.after(() => rmSync(directory, { recursive: true }));
  syncThemes(themes, directory, false);
  syncThemes(themes, directory, true);
  const legacy = resolve(directory, 'specialsboard.json');
  writeFileSync(legacy, '{}\n');
  assert.throws(() => syncThemes(themes, directory, true), /drift: specialsboard.json/);
  assert.equal(readFileSync(legacy, 'utf8'), '{}\n');
  rmSync(legacy);
  assert.throws(() => syncThemes(themes, directory, true), /drift: specialsboard.json/);
  syncThemes(themes, directory, false);
  writeFileSync(legacy, themes.get('specialsboard.json').replaceAll('\n', '\r\n'));
  assert.throws(() => syncThemes(themes, directory, true), /drift: specialsboard.json/);
  syncThemes(themes, directory, false);
  writeFileSync(resolve(directory, 'unmanaged.json'), '{}\n');
  assert.throws(() => syncThemes(themes, directory, true), /Unmanaged theme files/);
});

test('CLI checks from any working directory and rejects unknown flags', () => {
  const script = resolve(root, 'scripts', 'generate.mjs');
  const result = spawnSync(process.execPath, [script, '--check'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Checked 4 themes/);
  const invalid = spawnSync(process.execPath, [script, '--fix'], { cwd: tmpdir(), encoding: 'utf8' });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Usage:/);
});
