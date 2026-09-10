import assert from 'node:assert/strict';
import test from 'node:test';
import { buildThemes } from '../scripts/generate.mjs';
import { aliasTarget, colorToHex, compileSources, flattenTokens, loadSources } from '../scripts/tokens.mjs';
import { buildEvidence, evaluateTheme, failures } from '../scripts/accessibility.mjs';
import { validateContributions } from '../scripts/vscode.mjs';
import { luminance, rgba } from '../scripts/color.mjs';

const sources = loadSources();
const model = compileSources(sources).find(model => model.variant.key === 'light');
const outputs = buildThemes(sources);
const theme = JSON.parse(outputs.get(model.variant.output));
const role = path => colorToHex(model.tokens.get(path));

test('Light is selectable as vs/light; all four dark contribution identities remain unchanged', () => {
  assert.equal(model.variant.inherits, 'flagship');
  assert.equal(theme.type, 'light');
  assert.equal(theme.semanticHighlighting, true);
  assert.deepEqual(sources.manifest.contributes.themes.at(-1), {
    id: 'specials-board-light', label: 'Specials Board Light',
    uiTheme: 'vs', path: './themes/specialsboard-light.json'
  });
  for (const [key, label, output] of [
    ['', 'Specials Board', 'specialsboard-flagship.json'],
    ['-classic', 'Specials Board Classic', 'specialsboard-classic.json'],
    ['-contrast', 'Specials Board Contrast', 'specialsboard-contrast.json'],
    ['-legacy', 'Specials Board VS Code Legacy [Deprecated]', 'specialsboard.json']
  ]) {
    assert.deepEqual(sources.manifest.contributes.themes.find(item => item.id === `specials-board${key}`), {
      id: `specials-board${key}`, label, uiTheme: 'vs-dark', path: `./themes/${output}`
    });
    assert.equal(JSON.parse(outputs.get(output)).type, 'dark');
  }
  const changed = structuredClone(sources);
  changed.manifest.contributes.themes.at(-1).uiTheme = 'vs-dark';
  assert.throws(() => validateContributions(changed.manifest, changed.variants), /contributions/);
  delete changed.variants.at(-1).appearance;
  assert.throws(() => compileSources(changed), /appearance/);
});

test('Light inherits role relationships but every resolved semantic/component color is light-authored', () => {
  const tokens = new Map();
  for (const document of [
    sources.palette, sources.semantic, sources.components, sources.overrides.flagship, sources.overrides.light
  ]) {
    for (const entry of flattenTokens(document, sources.provenance, 'light-test')) tokens.set(...entry);
  }
  for (const path of tokens.keys()) {
    if (!/^(semantic|component)\./.test(path)) continue;
    let target = path;
    while (typeof tokens.get(target).$value === 'string') target = aliasTarget(tokens.get(target).$value);
    assert.match(target, /^palette\.light\./, `${path} leaks a dark palette: ${target}`);
  }
  const changed = structuredClone(sources);
  changed.overrides.flagship.semantic.syntax['function-builtin'].$value = '{semantic.syntax.type}';
  const child = compileSources(changed).find(item => item.variant.key === 'light');
  assert.equal(colorToHex(child.tokens.get('semantic.syntax.function-builtin')), role('semantic.syntax.type'));
  const parentOutputs = buildThemes(changed);
  changed.overrides.light.semantic.syntax.keyword.$value = '{semantic.syntax.string}';
  const changedOutputs = buildThemes(changed);
  for (const variant of sources.variants.filter(item => item.key !== 'light')) {
    assert.equal(changedOutputs.get(variant.output), parentOutputs.get(variant.output));
  }
  assert.equal(changedOutputs.get('specialsboard.json'), outputs.get('specialsboard.json'));
});

test('the registry accepts additional inherited light variants without renderer or schema edits', () => {
  const changed = structuredClone(sources);
  changed.variants.push({
    ...model.variant, key: 'light-paper', id: 'specials-board-light-paper', label: 'Paper test',
    vscodeId: 'specials-board-light-paper', output: 'specialsboard-light-paper.json', inherits: 'light'
  });
  changed.overrides['light-paper'] = { $description: 'Synthetic child to test open registry inheritance.' };
  changed.manifest.contributes.themes.push({
    id: 'specials-board-light-paper', label: 'Paper test', uiTheme: 'vs', path: './themes/specialsboard-light-paper.json'
  });
  const generated = buildThemes(changed);
  const paper = JSON.parse(generated.get('specialsboard-light-paper.json'));
  assert.equal(generated.size, 6);
  assert.deepEqual(paper, { ...theme, name: 'Paper test' });
  changed.variants.at(-1).inherits = 'light-paper';
  assert.throws(() => compileSources(changed), /inheritance cycle/);
});

test('whiteboard planes, marker colors and sixteen legible ANSI slots are deliberate', () => {
  const c = theme.colors;
  assert.equal(c['editor.background'], '#fafafa');
  assert.equal(c['editor.foreground'], '#222629');
  for (const id of ['editor.background', 'activityBar.background', 'sideBar.background', 'editorWidget.background']) {
    const channels = rgba(c[id]).slice(0, 3);
    assert.ok(Math.max(...channels) - Math.min(...channels) <= 6 / 255, `${id} should stay neutral, not cream`);
  }
  for (const [name, marker] of Object.entries({
    keyword: '#923b0d', string: '#1f5d32', number: '#164f9e',
    function: '#a12320', type: '#704f00', attribute: '#874009', regexp: '#6930a3'
  })) {
    assert.equal(role(`semantic.syntax.${name}`), marker);
    const channels = rgba(marker).slice(0, 3);
    assert.ok(Math.max(...channels) - Math.min(...channels) >= 60 / 255, `${name} should read as colored marker ink`);
  }
  assert.ok(luminance(rgba(c['activityBar.background'])) < luminance(rgba(c['sideBar.background'])));
  assert.ok(luminance(rgba(c['sideBar.background'])) < luminance(rgba(c['editor.background'])));
  assert.equal(c['button.foreground'], role('semantic.workbench.raised'));
  assert.equal(c['button.background'], role('semantic.syntax.keyword'));
  assert.equal(c['editorUnnecessaryCode.opacity'], '#000000');
  const ansi = Object.entries(c).filter(([id]) => id.startsWith('terminal.ansi'));
  assert.equal(ansi.length, 16);
  assert.equal(new Set(ansi.map(([, color]) => color)).size, 16);
  for (const [, color] of ansi) assert.match(color, /^#[0-9a-f]{6}$/);
});

test('Light enforces all composited text and indicator floors, while disclosing CVD limitations', () => {
  const result = buildEvidence(sources).results.find(result => result.key === 'light');
  assert.deepEqual(failures(result), []);
  assert.ok(result.rows.length > 24000);
  assert.ok(result.rows.every(row => row.minimum === (row.kind === 'indicator' ? 3 : 4.5)));
  assert.ok(result.cvd.some(pair => Object.values(pair.modes).some(mode => mode.distance < 0.05)));
  assert.ok(result.rows.some(row => row.group === 'merge/changed/selection+find'));
  assert.ok(result.rows.some(row => row.group === 'terminal/selectionBackground'));
  for (const [id, value] of [
    ['editor.selectionBackground', '#00000099'],
    ['editorUnnecessaryCode.opacity', '#00000040'],
    ['editorLineNumber.foreground', '#8f877e'],
    ['button.foreground', '#2f2b27'],
    ['focusBorder', '#e7e1d8'],
    ['terminal.ansiWhite', '#ffffff']
  ]) {
    const changed = structuredClone(theme);
    changed.colors[id] = value;
    assert.ok(failures(evaluateTheme(changed, model)).length, `${id} should fail Light's floors`);
  }
});
