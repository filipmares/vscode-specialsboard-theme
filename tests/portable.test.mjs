import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { colorToHex, compileSources, loadSources, root, stableJson, validateSchema } from '../scripts/tokens.mjs';
import { ansiSlots, portableColor, renderAnsi, syncPorts } from '../scripts/portable.mjs';
import { buildPorts, loadPortMappings, neovimHighlights, renderWindowsTerminal } from '../scripts/ports.mjs';
import { buildThemes } from '../scripts/generate.mjs';
import { contrast, rgba } from '../scripts/color.mjs';

const sources = loadSources();
const models = compileSources(sources);
const flagship = models.find(model => model.variant.key === 'flagship');
const ansi = JSON.parse(readFileSync(resolve(root, 'adapters', 'ansi.json'), 'utf8'));
const mappings = loadPortMappings();
const outputs = buildPorts(sources, mappings);

function resolvedHighlights(model, mapping = mappings.neovim) {
  const groups = neovimHighlights(mapping, model);
  return Object.fromEntries(Object.keys(groups).map(name => {
    let style = groups[name];
    while (style.link) style = groups[style.link];
    return [name, style];
  }));
}

test('portable colors require existing roles and explicit opaque composition', () => {
  for (const expression of [
    '#ffffff', 'white', '{palette.coda1.warm-white}', '{semantic.missing.color}',
    { over: ['{component.workbench.canvas}', '#ffffff'] },
    { over: ['{component.workbench.canvas}'] },
    { over: ['{component.workbench.canvas}', '{component.interaction.selection}'], alpha: 0.5 }
  ]) assert.throws(() => portableColor(expression, flagship), /portable-color:|Unresolved portable role/);
  assert.equal(portableColor('{component.workbench.canvas}', flagship), '#302e2c');
  assert.throws(() => portableColor('{component.interaction.selection}', flagship), /explicit over stack/);
  assert.throws(() => portableColor({
    over: ['{component.interaction.selection}', '{component.workbench.canvas}']
  }, flagship), /begin with an opaque/);
  assert.equal(portableColor({
    over: ['{component.workbench.canvas}', '{component.interaction.selection}']
  }, flagship), '#474e54');
  assert.notEqual(portableColor({
    over: ['{component.workbench.canvas}', '{component.interaction.selection}', '{component.interaction.find}']
  }, flagship), portableColor({
    over: ['{component.workbench.canvas}', '{component.interaction.find}', '{component.interaction.selection}']
  }, flagship));
});

test('portable ANSI preserves the canonical sixteen slots, independently of syntax', () => {
  assert.deepEqual(ansi, sources.mapping.ansi, 'Native ports must use the same role-to-slot meanings as VS Code');
  for (const slot of ansiSlots) {
    const role = slot.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    assert.equal(ansi[slot], `{semantic.terminal.${role}}`);
  }
  for (const model of models.filter(item => item.variant.key !== 'legacy')) {
    const output = renderAnsi(ansi, model);
    assert.deepEqual(Object.keys(output), ansiSlots);
    assert.equal(new Set(Object.values(output)).size, 16);
    for (const [slot, reference] of Object.entries(ansi)) {
      assert.equal(output[slot], portableColor(reference, model));
      assert.match(reference, /^\{semantic\.terminal\./);
    }
  }
  const invalid = structuredClone(ansi);
  invalid.red = '{semantic.syntax.keyword}';
  assert.throws(() => renderAnsi(invalid, flagship), /ansi-mapping:/);
  invalid.red = invalid.green;
  assert.throws(() => renderAnsi(invalid, flagship), /sixteen unique/);
  delete invalid.red;
  assert.throws(() => renderAnsi(invalid, flagship), /ansi-mapping:/);
  assert.throws(() => renderAnsi(ansi, models.find(model => model.variant.key === 'legacy')), /sixteen unique/);
  const swapped = { ...ansi, red: ansi.brightRed, brightRed: ansi.red };
  assert.throws(() => renderAnsi(swapped, flagship), /meaningfully lighter/);
});

test('portable drift detects missing, changed, CRLF and unmanaged files without repair', t => {
  const directory = mkdtempSync(resolve(tmpdir(), 'specialsboard-ports-'));
  t.after(() => rmSync(directory, { recursive: true }));
  const output = new Map([
    ['windows-terminal/specials-board.json', '{}\n'],
    ['neovim/colors/specials-board.lua', '-- generated\n']
  ]);
  assert.throws(() => syncPorts(output, directory, true), /portable drift/);
  syncPorts(output, directory, false);
  syncPorts(output, directory, true);
  const file = resolve(directory, 'neovim', 'colors', 'specials-board.lua');
  writeFileSync(file, '-- generated\r\n');
  assert.throws(() => syncPorts(output, directory, true), /portable drift/);
  assert.equal(readFileSync(file, 'utf8'), '-- generated\r\n');
  rmSync(file);
  assert.throws(() => syncPorts(output, directory, true), /portable drift/);
  syncPorts(output, directory, false);
  writeFileSync(resolve(directory, 'unmanaged.txt'), 'unmanaged');
  assert.throws(() => syncPorts(output, directory, true), /Unmanaged portable files/);
  assert.throws(() => syncPorts(new Map([['../outside.json', '{}']]), directory, false), /Unsafe portable output/);
});

test('ports regenerate byte-identically, ignore object order, and need no VS Code mapping or manifest', () => {
  function reverse(value) {
    if (Array.isArray(value)) return value.map(reverse);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reverse(v)]));
    return value;
  }
  const before = stableJson({ sources, mappings });
  assert.deepEqual(buildPorts(reverse(sources), reverse(mappings)), outputs);
  const portableSources = structuredClone(sources);
  delete portableSources.mapping;
  delete portableSources.manifest;
  assert.deepEqual(buildPorts(portableSources, mappings), outputs);
  assert.equal(stableJson({ sources, mappings }), before);
  assert.equal(outputs.size, 9);
  for (const [file, bytes] of outputs) {
    assert.doesNotMatch(file, /legacy/);
    assert.equal(bytes.includes('\r'), false);
    assert.ok(bytes.endsWith('\n'));
    assert.equal(readFileSync(resolve(root, 'ports', ...file.split('/')), 'utf8'), bytes);
  }
});

test('Phase 6 never changes any of the four public v3.3.0 VS Code bytes', () => {
  const hashes = {
    'specialsboard-flagship.json': 'fdee4d1b84ec6c0edf0d57d800c66353b7cfacf5c2506d8a9f44f5e87c5fb361',
    'specialsboard-classic.json': '0b2711e4f39bda94aaa638724fd745f4dea9afe54a25e439c7c7323fdaf35cd4',
    'specialsboard-contrast.json': 'f5489903fa820f0a1fe85678b8352e45c36eb0b8413c6be5492e3287e456f7ff',
    'specialsboard.json': 'fee187b5cac5c7f04ee4ca00a5bbb56ced8453c22487ccaeccf67950eb9ba5dc'
  };
  for (const [file, bytes] of buildThemes(sources)) {
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hashes[file], file);
    assert.equal(readFileSync(resolve(root, 'themes', file), 'utf8'), bytes);
  }
});

test('Windows Terminal has complete native fields, not magenta aliases or syntax semantics', () => {
  for (const model of models.filter(item => item.variant.key !== 'legacy')) {
    const theme = renderWindowsTerminal(mappings['windows-terminal'], ansi, model);
    assert.equal(theme.name, model.variant.label);
    assert.equal(Object.keys(theme).length, 21);
    assert.equal(theme.purple, portableColor(ansi.magenta, model));
    assert.equal(theme.brightPurple, portableColor(ansi.brightMagenta, model));
    assert.equal(theme.background, colorToHex(model.tokens.get('component.workbench.canvas')));
    assert.equal(theme.foreground, colorToHex(model.tokens.get('semantic.terminal.foreground')));
    assert.ok(theme.cursorColor && theme.selectionBackground);
    assert.equal(theme.magenta, undefined);
    for (const [key, value] of Object.entries(theme)) if (key !== 'name') assert.match(value, /^#[0-9a-f]{6}$/);
    const { red, ...incomplete } = theme;
    assert.throws(() => validateSchema('windows-terminal-theme', incomplete), /required/);
    assert.throws(() => validateSchema('windows-terminal-theme', { ...theme, magenta: red }), /additional properties/);
  }
});

test('native mappings reject unmanaged colors, links, typos, unsupported styles and mixed links', () => {
  for (const reference of ['#ffffff', 'white', '{palette.coda1.warm-white}', '{semantic.missing.color}']) {
    const input = structuredClone(mappings);
    input.neovim.highlights.Normal.fg = reference;
    assert.throws(() => buildPorts(sources, input), /neovim-mapping:|Unresolved portable role/);
    input.neovim = mappings.neovim;
    input['windows-terminal'].foreground = reference;
    assert.throws(() => buildPorts(sources, input), /windows-terminal-mapping:|Unresolved portable role/);
  }
  for (const mutate of [
    m => { m.highlights['@string.regex'] = { link: 'String' }; },
    m => { m.highlights.Comment.blink = true; },
    m => { m.highlights.Comment.fg = '{semantic.terminal.red}'; },
    m => { m.highlights.Comment.fg = '{semantic.terminal.red}'; m.highlights.Comment.link = 'String'; },
    m => { m.highlights.Comment = { link: 'UnmanagedLink' }; },
    m => { m.highlights.Comment = { link: 'String' }; m.highlights.String = { link: 'Comment' }; },
    m => { delete m.highlights.Normal; }
  ]) {
    const input = structuredClone(mappings);
    mutate(input.neovim);
    assert.throws(() => buildPorts(sources, input), /neovim-mapping:|Unresolved Neovim|link cycle|Missing required|ANSI roles belong/);
  }
});

test('variant inheritance flows through portable syntax, UI and ANSI without sibling contamination', () => {
  const input = structuredClone(sources);
  input.overrides.flagship.semantic.syntax.string.$value = '{palette.coda1.blue}';
  input.overrides.flagship.semantic.terminal.red.$value = '{palette.coda1.red-orange}';
  const changed = compileSources(input);
  for (const model of changed.filter(item => item.variant.key !== 'legacy')) {
    const groups = resolvedHighlights(model);
    const original = models.find(item => item.variant.key === model.variant.key);
    const expected = model.variant.key === 'classic' ? '#a0c25f' : '#6c99bb';
    assert.equal(groups.String.fg, expected);
    assert.equal(groups['@markup.raw'].fg, expected);
    assert.equal(groups.Normal.bg, resolvedHighlights(original).Normal.bg);
    const palette = renderAnsi(ansi, model);
    assert.equal(palette.red, model.variant.key === 'contrast'
      ? renderAnsi(ansi, original).red : '#da4632');
  }
  const originalLegacy = buildThemes(sources).get('specialsboard.json');
  assert.equal(buildThemes(input).get('specialsboard.json'), originalLegacy);
  const inherited = structuredClone(sources);
  inherited.overrides.classic.semantic.surface.canvas.$value = '{palette.phase4.canvas}';
  const classic = compileSources(inherited).find(model => model.variant.key === 'classic');
  assert.equal(resolvedHighlights(classic).Normal.bg, '#181715');
  assert.equal(renderWindowsTerminal(mappings['windows-terminal'], ansi, classic).background, '#181715');
});

test('native syntax meaning, Markdown styles, config keys, regex and LSP refinements use canonical roles', () => {
  const cases = {
    '@keyword': 'syntax.keyword', '@keyword.operator': 'syntax.operator-word',
    '@operator': 'syntax.operator', '@function.method': 'syntax.function',
    '@variable': 'syntax.variable', '@variable.member': 'syntax.property',
    '@variable.parameter': 'syntax.parameter', '@type': 'syntax.type',
    '@tag': 'syntax.tag', '@tag.attribute': 'syntax.attribute', '@string': 'syntax.string',
    '@string.regexp': 'syntax.regexp', '@string.escape': 'syntax.escape',
    '@markup.heading.1': 'markup.heading', '@markup.raw': 'markup.code',
    '@markup.link.url': 'markup.link', '@diff.plus': 'diff.inserted',
    jsonKeyword: 'syntax.property', jsonNull: 'syntax.constant',
    yamlBlockMappingKey: 'syntax.property', tomlKey: 'syntax.property',
    javaScriptRegexpString: 'syntax.regexp', javaScriptNull: 'syntax.constant',
    '@lsp.type.parameter': 'syntax.parameter', '@lsp.type.property': 'syntax.property',
    '@lsp.typemod.variable.readonly': 'syntax.constant'
  };
  for (const model of models.filter(item => item.variant.key !== 'legacy')) {
    const groups = resolvedHighlights(model);
    for (const [name, role] of Object.entries(cases)) assert.equal(groups[name].fg, colorToHex(model.tokens.get(`semantic.${role}`)), name);
    assert.equal(groups.Comment.italic, true);
    assert.equal(groups['@string.documentation'].italic, true);
    assert.equal(groups['@markup.strong'].bold, true);
    assert.equal(groups['@markup.italic'].italic, true);
    assert.equal(groups['@markup.link.url'].underline, true);
    assert.equal(groups.Error.underline, true);
    assert.equal(groups.DiagnosticUnderlineError.undercurl, true);
    assert.equal(groups.Visual.fg, undefined, 'Selection must not override syntax foreground');
    assert.equal(groups['@lsp.mod.deprecated'].strikethrough, true);
  }
});

test('Contrast portable base/current-line syntax, selected text and ANSI retain bounded color floors', () => {
  const model = models.find(item => item.variant.key === 'contrast');
  const groups = resolvedHighlights(model);
  const syntax = Object.entries(groups).filter(([name, style]) => name.startsWith('@') && style.fg).map(([, style]) => style.fg);
  for (const foreground of syntax) {
    for (const [group, floor] of [
      ['Normal', 7], ['CursorLine', 7], ['Visual', 4.5], ['Search', 4.5],
      ['IncSearch', 4.5], ['DiffAdd', 4.5], ['DiffChange', 4.5], ['DiffText', 4.5]
    ]) assert.ok(contrast(rgba(foreground), rgba(groups[group].bg)) >= floor, `${foreground} on ${group}`);
  }
  const terminal = renderWindowsTerminal(mappings['windows-terminal'], ansi, model);
  for (const color of Object.values(renderAnsi(ansi, model))) {
    assert.ok(contrast(rgba(color), rgba(terminal.background)) >= 4.5);
  }
  assert.ok(contrast(rgba(terminal.foreground), rgba(terminal.background)) >= 7);
});
