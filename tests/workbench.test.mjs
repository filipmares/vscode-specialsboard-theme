import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { buildThemes } from '../scripts/generate.mjs';
import { colorToHex, compileSources, loadSources } from '../scripts/tokens.mjs';

const sources = loadSources();
const outputs = buildThemes(sources);
const models = compileSources(sources);
const restored = ['flagship', 'classic', 'contrast'].map(key => ({
  key,
  theme: JSON.parse(outputs.get(`specialsboard-${key}.json`)),
  tokens: models.find(model => model.variant.key === key).tokens
}));

test('Phase 3 preserves the exact v3.0.0 flagship and Classic TextMate identities', () => {
  const hashes = {
    flagship: '33759f0c17d08faee149abcc31e401e7e19e0a2f82073d2b717c98abc5636125',
    classic: 'eae125e8066cf7aa60dd7194b1fec9e7cefa506a59d53b18d25ddbd761659abc'
  };
  for (const { key, theme } of restored.filter(item => item.key !== 'contrast')) {
    assert.equal(createHash('sha256').update(JSON.stringify(theme.tokenColors)).digest('hex'), hashes[key]);
  }
});

function luminance(hex) {
  const channels = hex.slice(1, 7).match(/../g).map(byte => parseInt(byte, 16) / 255);
  return channels.map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

test('ambient, navigation and canvas form three ordered persistent planes in each restored variant', () => {
  for (const { theme: { colors: c } } of restored) {
    assert.ok(luminance(c['activityBar.background']) < luminance(c['sideBar.background']));
    assert.ok(luminance(c['sideBar.background']) < luminance(c['editor.background']));
    assert.equal(c['titleBar.activeBackground'], c['activityBar.background']);
    assert.equal(c['statusBar.background'], c['activityBar.background']);
    assert.equal(c['tab.inactiveBackground'], c['sideBar.background']);
    assert.equal(c['tab.activeBackground'], c['editor.background']);
    assert.equal(c['panel.background'], c['editor.background']);
    assert.equal(c['notebook.cellEditorBackground'], c['editor.background']);
  }
});

test('interactive families preserve normal, hover, active, focus, unfocused, disabled and feedback roles', () => {
  for (const { theme: { colors: c } } of restored) {
    assert.equal(new Set([
      c['sideBar.background'], c['list.hoverBackground'],
      c['list.activeSelectionBackground'], c['list.inactiveSelectionBackground']
    ]).size, 4);
    for (const id of ['list.focusOutline', 'inputOption.activeBorder', 'notebook.focusedCellBorder', 'statusBarItem.focusBorder']) {
      assert.equal(c[id], c.focusBorder, id);
    }
    assert.equal(c['list.inactiveSelectionForeground'], c.foreground);
    assert.notEqual(c.disabledForeground, c.foreground);
    assert.notEqual(c.disabledForeground, c.descriptionForeground);
    assert.notEqual(c['button.foreground'], c.foreground);
    assert.notEqual(c['button.background'], c['button.hoverBackground']);
    assert.notEqual(c['inputValidation.errorBackground'], c['input.background']);
    for (const [kind, id] of [['error', 'Error'], ['warning', 'Warning'], ['info', 'Info']]) {
      assert.equal(c[`inputValidation.${kind}Border`], c[`editor${id}.foreground`]);
      assert.equal(c[`problems${id}Icon.foreground`], c[`editor${id}.foreground`]);
    }
  }
});

test('text overlays remain translucent, line/word diff layers are ordered, and selections preserve syntax colors', () => {
  const overlays = [
    'editor.selectionBackground', 'editor.inactiveSelectionBackground',
    'editor.selectionHighlightBackground', 'editor.wordHighlightBackground',
    'editor.wordHighlightStrongBackground', 'editor.findMatchBackground',
    'editor.findMatchHighlightBackground', 'editor.lineHighlightBackground',
    'diffEditor.insertedTextBackground', 'diffEditor.removedTextBackground',
    'diffEditor.insertedLineBackground', 'diffEditor.removedLineBackground',
    'merge.currentContentBackground', 'merge.incomingContentBackground',
    'inlineEdit.originalChangedTextBackground', 'inlineEdit.modifiedChangedTextBackground'
  ];
  for (const { theme: { colors: c } } of restored) {
    for (const id of overlays) {
      assert.match(c[id], /^#[0-9a-f]{8}$/, id);
      const alpha = parseInt(c[id].slice(7), 16);
      assert.ok(alpha > 0 && alpha < 128, `${id} must not obscure source text`);
    }
    assert.ok(parseInt(c['diffEditor.insertedTextBackground'].slice(7), 16)
      > parseInt(c['diffEditor.insertedLineBackground'].slice(7), 16));
    assert.notEqual(c['merge.currentContentBackground'], c['merge.incomingContentBackground']);
    assert.equal(Object.hasOwn(c, 'editor.selectionForeground'), false);
    assert.equal(Object.hasOwn(c, 'editor.findMatchForeground'), false);
  }
});

test('all sixteen ANSI slots are unique and each bright partner is perceptibly lighter', () => {
  for (const { theme: { colors: c } } of restored) {
    const ansi = Object.entries(c).filter(([id]) => id.startsWith('terminal.ansi'));
    assert.equal(ansi.length, 16);
    assert.equal(new Set(ansi.map(([, value]) => value)).size, 16);
    for (const slot of ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']) {
      const normal = c[`terminal.ansi${slot}`];
      const bright = c[`terminal.ansiBright${slot}`];
      assert.match(normal, /^#[0-9a-f]{6}$/);
      assert.ok(luminance(bright) - luminance(normal) > 0.1, slot);
    }
  }
});

test('minimap/overview markers and chat labels honor upstream transparency requirements', () => {
  const ids = [
    'minimap.findMatchHighlight', 'minimap.selectionHighlight', 'minimap.selectionOccurrenceHighlight',
    'editorOverviewRuler.findMatchForeground', 'editorOverviewRuler.rangeHighlightForeground',
    'editorOverviewRuler.selectionHighlightForeground', 'editorOverviewRuler.wordHighlightForeground',
    'editorOverviewRuler.wordHighlightStrongForeground', 'editorOverviewRuler.wordHighlightTextForeground',
    'chat.linesAddedForeground', 'chat.linesRemovedForeground'
  ];
  for (const { theme } of restored) {
    for (const id of ids) {
      assert.match(theme.colors[id], /^#[0-9a-f]{8}$/);
      const alpha = parseInt(theme.colors[id].slice(7), 16);
      assert.ok(alpha > 0 && alpha < 255, id);
    }
  }
});

test('public color snapshot rejects invented, private and unsupported IDs and a stale engine floor', () => {
  for (const id of ['editor.notAColor', 'signatureHelp.background', 'inlineEdit.indicator.background', 'testing.message.error.decorationForeground']) {
    const input = structuredClone(sources);
    input.mapping.workbench[id] = '{component.workbench.canvas}';
    assert.throws(() => buildThemes(input), /vscode-mapping:/, id);
  }
  for (const floor of ['^1.34.0', '^1.99.0', '^1.100.0', '^1.136.0']) {
    const input = structuredClone(sources);
    input.manifest.engines.vscode = floor;
    assert.throws(() => buildThemes(input), /snapshot floor/);
  }
  const inlineEdit = Object.keys(sources.mapping.workbench).filter(id => id.startsWith('inlineEdit.'));
  assert.equal(inlineEdit.length, 20, 'The explicitly documented inline-edit state family must remain complete');
});

test('semantic tokens classify symbols into the existing syntax families, not a second palette', () => {
  const roles = {
    namespace: 'type', type: 'type', class: 'type', enum: 'type',
    interface: 'type', struct: 'type', typeParameter: 'type',
    variable: 'variable', parameter: 'parameter', property: 'property',
    'variable.readonly': 'constant', 'property.readonly': 'constant', enumMember: 'constant',
    function: 'function', method: 'function', decorator: 'decorator', event: 'property',
    keyword: 'keyword', string: 'string', number: 'number', regexp: 'regexp', operator: 'operator',
    comment: 'comment'
  };
  for (const { theme, tokens } of restored) {
    assert.equal(theme.semanticHighlighting, true);
    assert.deepEqual(Object.keys(theme.semanticTokenColors).sort(), Object.keys(roles).sort());
    for (const [selector, role] of Object.entries(roles)) {
      const style = theme.semanticTokenColors[selector];
      assert.equal(typeof style === 'string' ? style : style.foreground, colorToHex(tokens.get(`semantic.syntax.${role}`)), selector);
    }
    assert.equal(theme.semanticTokenColors.comment.italic, true);
    assert.equal(Object.hasOwn(theme.semanticTokenColors, '*.readonly'), false);
    assert.equal(Object.hasOwn(theme.semanticTokenColors, '*.defaultLibrary'), false);
  }
});

test('role changes propagate across workflow families without recoloring Legacy or syntax', () => {
  const input = structuredClone(sources);
  input.semantic.semantic.workbench.accent.$value = '{palette.phase2.blue}';
  const changed = buildThemes(input);
  assert.equal(changed.get('specialsboard.json'), outputs.get('specialsboard.json'));
  for (const { key, theme } of restored) {
    const next = JSON.parse(changed.get(`specialsboard-${key}.json`));
    for (const id of ['focusBorder', 'tab.activeBorderTop', 'button.background', 'progressBar.background']) {
      assert.equal(next.colors[id], '#8aafcb', id);
    }
    assert.deepEqual(next.tokenColors, theme.tokenColors);
    assert.deepEqual(next.semanticTokenColors, theme.semanticTokenColors);
  }
});
